import type { PluginCreator } from "tailwindcss/types/config";

declare module "daisyui" {
  export interface Options {
    themes?: boolean | string[] | { [key: string]: Record<string, string> }[];
    darkTheme?: string;
    base?: boolean;
    styled?: boolean;
    utils?: boolean;
    rtl?: boolean;
    prefix?: string;
    logs?: boolean;
  }

  const daisyui: {
    handler: PluginCreator;
    config?: Options;
  };

  export default daisyui;
}
