import {
  defineConfig,
  globalIgnores,
} from "eslint/config";

import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  {
    files: [
      "**/*.{js,jsx,ts,tsx}",
    ],

    rules: {
      /*
       * This project intentionally performs several
       * fetch-on-mount, local-storage hydration, and
       * image-fallback state updates from effects.
       *
       * The React compiler lint rule is useful for new
       * code, but treating all existing patterns as
       * errors would require broad behavioral rewrites.
       *
       * Keep the more important React rules such as
       * react-hooks/refs and react-hooks/purity enabled.
       */
      "react-hooks/set-state-in-effect":
        "off",

      /*
       * Plain quotation marks inside rendered text are
       * valid HTML/JSX output. This is a stylistic rule
       * and does not affect runtime correctness.
       */
      "react/no-unescaped-entities":
        "off",

      /*
       * Permit intentionally unused parameters such as:
       *
       *   _request
       *
       * while still reporting genuinely unused values.
       */
      "@typescript-eslint/no-unused-vars":
        [
          "warn",
          {
            argsIgnorePattern: "^_",
            varsIgnorePattern: "^_",
            caughtErrorsIgnorePattern:
              "^_",
          },
        ],
    },
  },

  globalIgnores([
    /*
     * Next.js generated output.
     */
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",

    /*
     * Standalone maintenance/debug scripts use
     * CommonJS intentionally and are not part of the
     * Next.js application bundle.
     */
    "scripts/**/*.js",
    "test-supabase.js",
  ]),
]);

export default eslintConfig;