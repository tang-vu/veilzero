import { describe, expect, it } from "vitest";
import {
  classifyPoolSurface,
  contractFunctions,
  formatTokenUnits,
  shortString,
} from "./strk20-pool-probe.mjs";

describe("STRK20 pool probe", () => {
  it("finds nested Cairo interface functions and the legacy screening surface", () => {
    const functions = contractFunctions(JSON.stringify([
      {
        type: "interface",
        items: [
          {
            type: "function",
            name: "apply_actions",
            inputs: [
              { type: "core::array::Span::<privacy::actions::ServerAction>" },
              { type: "core::option::Option::<privacy::snip12::ScreeningAttestation>" },
            ],
          },
        ],
      },
    ]));
    expect(classifyPoolSurface(functions)).toMatchObject({
      surface: "legacy-global-screening",
      documentedHelperReturn: "Span<OpenNoteDeposit>",
    });
  });

  it("fails closed when apply_actions is missing", () => {
    expect(() => classifyPoolSurface([])).toThrow("no apply_actions");
  });

  it("formats exact token units and Cairo short strings", () => {
    expect(formatTokenUnits("6000000000000000000")).toBe("6");
    expect(formatTokenUnits("6000000000000000001")).toBe("6.000000000000000001");
    expect(shortString("0x322e30")).toBe("2.0");
  });
});
