import { test } from "uvu";
import * as assert from "uvu/assert";

import Provider from "../src/provider";

test("should return instance of provider", () => {
  const provider = new Provider();
  assert.instance(provider, Provider);
});

test.only("should read workspaces", () => {
  const provider = new Provider();

  assert.equal(provider.workspaces, [
    "/home/john/src/dotfiles",
    "/home/john/src/main-project-folder",
  ]);
});

test.run();
