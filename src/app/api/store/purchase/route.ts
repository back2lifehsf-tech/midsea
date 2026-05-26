/**
 * POST /api/store/purchase — Mejora 9 (Tienda Coin) + ADR-004.
 *
 * Canje de un StoreItem por Coins. En v1 del pilot, TODA compra queda en
 * PENDING_APPROVAL — el padre la aprueba desde Parent Copilot (v1.1). Los
 * Coins se descuentan al instante (reserva de saldo) vía una CoinEntry
 * negativa; si el padre rechaza, v1.1 crea una CoinEntry positiva de
 * devolución.
 *
 * Side effects (transacción atómica):
 *   - Insert StorePurchase { status: PENDING_APPROVAL, coinSpent }
 *   - Insert CoinEntry { amount: -coinPrice, reason: STORE_PURCHASE, refId }
 *
 * Body: { itemId: string }
 * Response: { success: true, purchase: { id, status } }
 */
import { NextResponse, type NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { z } from 'zod';
import { authOptions } from '@/app/api/auth/options';
import { prisma } from '@/lib/prisma';

const BodySchema = z.object({ itemId: z.string().min(1) });

function jsonError(status: number, code: string) {
  return NextResponse.json({ error: code }, { status });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.studentId) return jsonError(401, 'unauthorized');
  const studentId = session.user.studentId;

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return jsonError(400, 'invalid_json');
  }
  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) return jsonError(400, 'invalid_body');
  const { itemId } = parsed.data;

  // Ítem activo.
  const item = await prisma.storeItem.findUnique({ where: { id: itemId } });
  if (!item || !item.active) return jsonError(404, 'item_not_found');

  // No re-comprar un ítem ya desbloqueado o pendiente.
  const existing = await prisma.storePurchase.findFirst({
    where: { studentId, itemId, status: { in: ['PENDING_APPROVAL', 'APPROVED'] } }
  });
  if (existing) return jsonError(409, 'already_owned');

  // Saldo actual = SUM(CoinEntry.amount).
  const agg = await prisma.coinEntry.aggregate({
    where: { studentId },
    _sum: { amount: true }
  });
  const balance = agg._sum.amount ?? 0;
  if (balance < item.coinPrice) return jsonError(409, 'insufficient_coins');

  // Transacción atómica: StorePurchase + CoinEntry negativa (refId = purchase.id).
  const purchase = await prisma.$transaction(async (tx) => {
    const created = await tx.storePurchase.create({
      data: {
        studentId,
        itemId: item.id,
        coinSpent: item.coinPrice,
        status: 'PENDING_APPROVAL'
      }
    });
    await tx.coinEntry.create({
      data: {
        studentId,
        amount: -item.coinPrice,
        reason: 'STORE_PURCHASE',
        refId: created.id,
        note: `Store purchase: ${item.titleEs}`
      }
    });
    return created;
  });

  return NextResponse.json({
    success: true,
    purchase: { id: purchase.id, status: purchase.status }
  });
}
