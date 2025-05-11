import Glib from "gi://GLib";

export const fileExists = (path: string): boolean =>
  Glib.file_test(path, Glib.FileTest.EXISTS);
