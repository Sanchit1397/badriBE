import { Types } from 'mongoose';
import { User } from '../models/User';

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Adds $or search conditions to an order filter (status/userId constraints remain ANDed).
 */
export async function applyOrderSearch(
  filter: Record<string, unknown>,
  q: string | undefined,
  options: { includeUserSearch?: boolean } = {}
): Promise<void> {
  const trimmed = q?.trim();
  if (!trimmed) return;

  const escaped = escapeRegex(trimmed);
  const regex = new RegExp(escaped, 'i');
  const orConditions: Record<string, unknown>[] = [
    { phone: regex },
    { address: regex },
    { 'items.name': regex },
    { status: regex },
  ];

  const idPart = trimmed.replace(/^#/, '').replace(/\s/g, '');
  if (/^[a-fA-F0-9]{4,24}$/.test(idPart)) {
    if (Types.ObjectId.isValid(idPart) && idPart.length === 24) {
      orConditions.push({ _id: new Types.ObjectId(idPart) });
    } else {
      orConditions.push({
        $expr: {
          $regexMatch: {
            input: { $toString: '$_id' },
            regex: escaped,
            options: 'i',
          },
        },
      });
    }
  }

  if (options.includeUserSearch) {
    const users = await User.find({
      $or: [{ name: regex }, { email: regex }],
    })
      .select('_id')
      .limit(100)
      .lean();
    if (users.length > 0) {
      orConditions.push({ userId: { $in: users.map((u) => u._id) } });
    }
  }

  filter.$or = orConditions;
}
