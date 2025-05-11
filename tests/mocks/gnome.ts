enum FileTest {
  EXISTS,
}

class GdaConnectionMock {
  private testData = [
    null,
    "/home/john/src/dotfiles",
    "/home/john/src/additional-folder,/home/john/src/main-project-folder",
  ];

  private iterPosition: number;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(_opts: never) {
    this.iterPosition = -1;
  }

  open() {}
  close() {}

  execute_select_command() {
    return this;
  }

  create_iter() {
    return this;
  }

  move_next() {
    this.iterPosition += 1;
    return this.testData.length > this.iterPosition;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  get_value_at(_col: number) {
    return this.testData.at(this.iterPosition);
  }
}

export default {
  AppSystem: {
    get_default() {
      return {
        lookup_app() {
          return {};
        },
      };
    },
  },
  get_user_config_dir() {},
  get_home_dir() {
    return "/home/john";
  },
  FileTest,
  file_test() {
    return true;
  },

  // Gda
  Connection: GdaConnectionMock,
  Config: {
    get_provider() {
      return {};
    },
  },
};
