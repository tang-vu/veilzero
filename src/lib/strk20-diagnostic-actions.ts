import type { WALLET_API } from "@starknet-io/types-js";
import { ec, num } from "starknet";
import { z } from "zod";

const address = z.string().max(66).regex(/^0x[0-9a-f]+$/i).refine((value) => {
  const parsed = BigInt(value);
  return parsed > 0n && parsed < BigInt(ec.starkCurve.MAX_VALUE);
}, "Expected a non-zero Starknet address.");

export function parseTokenAmount(value: string, decimals = 18): string {
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 30) throw new Error("Token decimals must be between 0 and 30.");
  if (!/^(?:0|[1-9][0-9]*)(?:\.[0-9]+)?$/.test(value)) throw new Error("Amount must be a plain positive decimal.");
  const [whole, fraction = ""] = value.split(".");
  if (fraction.length > decimals) throw new Error(`Amount has more than ${decimals} decimal places.`);
  const units = BigInt(whole) * (10n ** BigInt(decimals)) + BigInt((fraction + "0".repeat(decimals)).slice(0, decimals) || "0");
  if (units <= 0n || units >= BigInt(ec.starkCurve.MAX_VALUE)) throw new Error("Amount is outside the supported felt range.");
  return num.toHex(units);
}

const diagnosticInput = z.object({ token: address, amount: z.string().min(1).max(96), decimals: z.number().int().min(0).max(30).default(18) });
const recipientInput = diagnosticInput.extend({ recipient: address });

export function buildShieldDiagnostic(rawInput: z.input<typeof diagnosticInput>): WALLET_API.STRK20_ACTION[] {
  const input = diagnosticInput.parse(rawInput);
  return [{ type: "deposit", token: input.token, amount: parseTokenAmount(input.amount, input.decimals) }];
}

export function buildPrivateTransferDiagnostic(rawInput: z.input<typeof recipientInput>): WALLET_API.STRK20_ACTION[] {
  const input = recipientInput.parse(rawInput);
  return [{
    type: "transfer",
    token: input.token,
    amount: parseTokenAmount(input.amount, input.decimals),
    recipient: input.recipient,
  }];
}

export function buildPrivateSelfTransferDiagnostic(
  rawInput: z.input<typeof diagnosticInput>,
  connectedAccountAddress: string,
): WALLET_API.STRK20_ACTION[] {
  return buildPrivateTransferDiagnostic({ ...rawInput, recipient: address.parse(connectedAccountAddress) });
}

export function buildUnshieldDiagnostic(rawInput: z.input<typeof recipientInput>): WALLET_API.STRK20_ACTION[] {
  const input = recipientInput.parse(rawInput);
  return [{
    type: "withdraw",
    token: input.token,
    amount: parseTokenAmount(input.amount, input.decimals),
    recipient: input.recipient,
  }];
}
