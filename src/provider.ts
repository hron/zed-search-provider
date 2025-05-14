import Glib from "gi://GLib";
import Gio from "gi://Gio";
import Gda from "gi://Gda";
import Shell from "gi://Shell";
import { Extension } from "resource:///org/gnome/shell/extensions/extension.js";
import { AppSearchProvider } from "resource:///org/gnome/shell/ui/appDisplay.js";
import { fileExists } from "./util.js";

export default class ZedSearchProvider<T extends Extension>
  implements AppSearchProvider
{
  workspaces: string[] = [];
  extension: T;
  app: Shell.App | null = null;
  appInfo: Gio.DesktopAppInfo | undefined;

  constructor(extension: T) {
    this.extension = extension;
    this._findApp();
    this._loadWorkspaces();
    this.appInfo = this.app?.appInfo;
  }

  _loadWorkspaces() {
    const projectList = this._getProjectList();
    if (!projectList) {
      console.error("Failed to read Zed workspace database file");
      return;
    }

    this.workspaces = projectList;
  }

  _getProjectList(): string[] | undefined {
    const possibleLocations = [
      // ~/.local/zed.app/ installation
      `${Glib.get_home_dir()}/.local/share/zed/db/0-stable`,
      // Flatpak - Stable
      `${Glib.get_home_dir()}/.var/app/dev.zed.Zed/data/zed/db/0-stable`,
    ];

    for (const zedDBPath of possibleLocations) {
      if (!zedDBPath || !fileExists(zedDBPath)) {
        continue;
      }

      try {
        const zedDb = new Gda.Connection({
          provider: Gda.Config.get_provider("sqlite"),
          cncString: `DB_DIR=${zedDBPath};DB_NAME=db.sqlite`,
        });
        zedDb.open();

        const iter = zedDb
          .execute_select_command("SELECT local_paths_array FROM workspaces")
          .create_iter();
        const paths: string[] = [];
        while (iter.move_next()) {
          const p = iter.get_value_at(0) as unknown as string | null;
          if (p !== null) {
            paths.push(p);
          }
        }
        zedDb.close();
        return paths.filter((p) => p !== null).map((p) => p.split(",").at(-1)!);
      } catch (error) {
        console.error(
          "Couldn't fetch workspace data from the database: ",
          error,
        );
      }
    }
  }

  _findApp() {
    const ids = [
      // ~/.local/zed.app/ installation
      "zed",
      // Flatpak
      "dev.zed.Zed",
    ];

    for (let i = 0; !this.app && i < ids.length; i++) {
      this.app = Shell.AppSystem.get_default().lookup_app(ids[i] + ".desktop");
    }

    if (!this.app) {
      console.error("Failed to find Zed application");
    }
  }

  activateResult(path: string): void {
    if (this.app) {
      try {
        const normalizedPath = this._resolveHomePath(path);
        this.app?.app_info.launch(
          [Gio.file_new_for_path(normalizedPath)],
          null,
        );
      } catch (e) {
        console.error(e);
      }
    }
  }

  filterResults(results: string[], maxResults: number) {
    return results.slice(0, maxResults);
  }

  async getInitialResultSet(terms: string[]) {
    this._loadWorkspaces();
    return this.getSubsearchResultSet(this.workspaces, terms);
  }

  async getSubsearchResultSet(previousResults: string[], terms: string[]) {
    const searchTerm = terms.join("").toLowerCase();
    return previousResults.filter((path) =>
      path.toLowerCase().includes(searchTerm),
    );
  }

  async getResultMetas(projects: string[]) {
    return projects.map((project) => ({
      id: project,
      name:
        project
          .split("/")
          .filter((p) => p)
          .at(-1) || project,
      description: project,
      createIcon: (size: number) => this.app?.create_icon_texture(size),
    }));
  }

  _resolveHomePath(path: string): string {
    return path.replace(/^~/, Glib.get_home_dir());
  }
}
