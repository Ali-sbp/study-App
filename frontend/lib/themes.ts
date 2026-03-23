export interface Theme {
  id: string
  label: string
  icon: string
  monaco: string // name passed to MonacoEditor theme prop
  vars: Record<string, string> // CSS custom properties
}

export const THEMES: Theme[] = [
  {
    id: "dark",
    label: "Dark",
    icon: "●",
    monaco: "hs-dark",
    vars: {
      "--crust":   "#11111b",
      "--base":    "#1e1e2e",
      "--mantle":  "#181825",
      "--surface": "#313244",
      "--overlay": "#45475a",
      "--subtext": "#6c7086",
      "--text":    "#cdd6f4",
      "--accent":  "#cba6f7",
      "--green":   "#a6e3a1",
      "--red":     "#f38ba8",
      "--blue":    "#89b4fa",
    },
  },
  {
    id: "light",
    label: "Light",
    icon: "○",
    monaco: "hs-light",
    vars: {
      "--crust":   "#dce0e8",
      "--base":    "#eff1f5",
      "--mantle":  "#e6e9ef",
      "--surface": "#ccd0da",
      "--overlay": "#bcc0cc",
      "--subtext": "#9ca0b0",
      "--text":    "#4c4f69",
      "--accent":  "#8839ef",
      "--green":   "#40a02b",
      "--red":     "#d20f39",
      "--blue":    "#1e66f5",
    },
  },
  {
    id: "monokai",
    label: "Monokai",
    icon: "◆",
    monaco: "hs-monokai",
    vars: {
      "--crust":   "#1a1a1a",
      "--base":    "#272822",
      "--mantle":  "#1e1f1c",
      "--surface": "#3e3d32",
      "--overlay": "#49483e",
      "--subtext": "#75715e",
      "--text":    "#f8f8f2",
      "--accent":  "#a6e22e",
      "--green":   "#a6e22e",
      "--red":     "#f92672",
      "--blue":    "#66d9e8",
    },
  },
  {
    id: "nord",
    label: "Nord",
    icon: "◈",
    monaco: "hs-nord",
    vars: {
      "--crust":   "#242831",
      "--base":    "#2e3440",
      "--mantle":  "#292e39",
      "--surface": "#3b4252",
      "--overlay": "#434c5e",
      "--subtext": "#616e88",
      "--text":    "#d8dee9",
      "--accent":  "#88c0d0",
      "--green":   "#a3be8c",
      "--red":     "#bf616a",
      "--blue":    "#81a1c1",
    },
  },
  {
    id: "crimson",
    label: "Crimson",
    icon: "♦",
    monaco: "hs-crimson",
    vars: {
      "--crust":   "#0e0707",
      "--base":    "#1a0d0d",
      "--mantle":  "#140a0a",
      "--surface": "#2e1414",
      "--overlay": "#4a1f1f",
      "--subtext": "#9e6060",
      "--text":    "#f2d5d5",
      "--accent":  "#e05252",
      "--green":   "#7ec98a",
      "--red":     "#ff3a3a",
      "--blue":    "#d4887c",
    },
  },
  {
    id: "rose",
    label: "Rose",
    icon: "✿",
    monaco: "hs-rose",
    vars: {
      "--crust":   "#f5d6e8",
      "--base":    "#fce8f3",
      "--mantle":  "#f8dff0",
      "--surface": "#f0b8d8",
      "--overlay": "#e090c0",
      "--subtext": "#b05080",
      "--text":    "#5a1a3a",
      "--accent":  "#d6006e",
      "--green":   "#2d8a5e",
      "--red":     "#cc0044",
      "--blue":    "#8844cc",
    },
  },
]

export const DEFAULT_THEME = THEMES[0]

/** Call this in MonacoEditor's beforeMount to register the tokenizer + all 4 themes. */
export function registerMonacoThemes(monaco: any) {
  // ── Haskell Monarch tokenizer (shared by all themes) ──────────────
  monaco.languages.register({ id: "haskell" })
  monaco.languages.setMonarchTokensProvider("haskell", {
    defaultToken: "",
    tokenPostfix: ".hs",
    keywords: [
      "where", "let", "in", "do", "case", "of", "if", "then", "else",
      "module", "import", "qualified", "as", "hiding",
      "data", "type", "newtype", "class", "instance", "deriving",
      "forall", "family", "default", "infix", "infixl", "infixr",
    ],
    tokenizer: {
      root: [
        [/\{-/, "comment", "@blockComment"],
        [/--.*$/, "comment"],
        [/"/, "string", "@string"],
        [/'(?:[^\\']|\\.)'/, "string.char"],
        [/[A-Z][a-zA-Z0-9_']*/, "type.identifier"],
        [/[a-z_][a-zA-Z0-9_']*/, { cases: { "@keywords": "keyword", "@default": "identifier" } }],
        [/0[xX][0-9a-fA-F]+/, "number.hex"],
        [/\d+(\.\d+)?([eE][+-]?\d+)?/, "number"],
        [/[!#$%&*+./<=>?@\\^|~\-:]+/, "operator"],
        [/[()[\]{},;`]/, "delimiter"],
      ],
      blockComment: [
        [/\{-/, "comment", "@push"],
        [/-\}/, "comment", "@pop"],
        [/./, "comment"],
      ],
      string: [
        [/[^\\"]+/, "string"],
        [/\\./, "string.escape"],
        [/"/, "string", "@pop"],
      ],
    },
  })

  // ── Theme: Dark (VS Code Dark+) ───────────────────────────────────
  monaco.editor.defineTheme("hs-dark", {
    base: "vs-dark", inherit: true,
    rules: [
      { token: "comment",         foreground: "6a9955", fontStyle: "italic" },
      { token: "keyword",         foreground: "c586c0" },
      { token: "type.identifier", foreground: "4ec9b0" },
      { token: "string",          foreground: "ce9178" },
      { token: "string.char",     foreground: "ce9178" },
      { token: "string.escape",   foreground: "d7ba7d" },
      { token: "number",          foreground: "b5cea8" },
      { token: "number.hex",      foreground: "b5cea8" },
      { token: "operator",        foreground: "d4d4d4" },
      { token: "delimiter",       foreground: "d4d4d4" },
      { token: "identifier",      foreground: "9cdcfe" },
    ],
    colors: {
      "editor.background":              "#1e1e1e",
      "editor.foreground":              "#d4d4d4",
      "editorLineNumber.foreground":    "#858585",
      "editor.lineHighlightBackground": "#2a2d2e",
      "editorCursor.foreground":        "#aeafad",
    },
  })

  // ── Theme: Light (VS Code Light+) ────────────────────────────────
  monaco.editor.defineTheme("hs-light", {
    base: "vs", inherit: true,
    rules: [
      { token: "comment",         foreground: "008000", fontStyle: "italic" },
      { token: "keyword",         foreground: "af00db" },
      { token: "type.identifier", foreground: "267f99" },
      { token: "string",          foreground: "a31515" },
      { token: "string.char",     foreground: "a31515" },
      { token: "string.escape",   foreground: "ee0000" },
      { token: "number",          foreground: "098658" },
      { token: "number.hex",      foreground: "098658" },
      { token: "operator",        foreground: "000000" },
      { token: "delimiter",       foreground: "000000" },
      { token: "identifier",      foreground: "001080" },
    ],
    colors: {
      "editor.background":              "#ffffff",
      "editor.foreground":              "#000000",
      "editorLineNumber.foreground":    "#237893",
      "editor.lineHighlightBackground": "#f0f0f0",
      "editorCursor.foreground":        "#000000",
    },
  })

  // ── Theme: Monokai ────────────────────────────────────────────────
  monaco.editor.defineTheme("hs-monokai", {
    base: "vs-dark", inherit: true,
    rules: [
      { token: "comment",         foreground: "75715e", fontStyle: "italic" },
      { token: "keyword",         foreground: "f92672" },
      { token: "type.identifier", foreground: "66d9e8" },
      { token: "string",          foreground: "e6db74" },
      { token: "string.char",     foreground: "e6db74" },
      { token: "string.escape",   foreground: "ae81ff" },
      { token: "number",          foreground: "ae81ff" },
      { token: "number.hex",      foreground: "ae81ff" },
      { token: "operator",        foreground: "f8f8f2" },
      { token: "delimiter",       foreground: "f8f8f2" },
      { token: "identifier",      foreground: "a6e22e" },
    ],
    colors: {
      "editor.background":              "#272822",
      "editor.foreground":              "#f8f8f2",
      "editorLineNumber.foreground":    "#90908a",
      "editor.lineHighlightBackground": "#3e3d32",
      "editorCursor.foreground":        "#f8f8f0",
    },
  })

  // ── Theme: Nord ───────────────────────────────────────────────────
  monaco.editor.defineTheme("hs-nord", {
    base: "vs-dark", inherit: true,
    rules: [
      { token: "comment",         foreground: "616e88", fontStyle: "italic" },
      { token: "keyword",         foreground: "81a1c1" },
      { token: "type.identifier", foreground: "8fbcbb" },
      { token: "string",          foreground: "a3be8c" },
      { token: "string.char",     foreground: "a3be8c" },
      { token: "string.escape",   foreground: "ebcb8b" },
      { token: "number",          foreground: "b48ead" },
      { token: "number.hex",      foreground: "b48ead" },
      { token: "operator",        foreground: "d8dee9" },
      { token: "delimiter",       foreground: "d8dee9" },
      { token: "identifier",      foreground: "d8dee9" },
    ],
    colors: {
      "editor.background":              "#2e3440",
      "editor.foreground":              "#d8dee9",
      "editorLineNumber.foreground":    "#4c566a",
      "editor.lineHighlightBackground": "#3b4252",
      "editorCursor.foreground":        "#d8dee9",
    },
  })

  // ── Theme: Crimson ────────────────────────────────────────────────
  monaco.editor.defineTheme("hs-crimson", {
    base: "vs-dark", inherit: true,
    rules: [
      { token: "comment",         foreground: "7a4040", fontStyle: "italic" },
      { token: "keyword",         foreground: "e05252" },   // blood red
      { token: "type.identifier", foreground: "e8956d" },   // burnt orange
      { token: "string",          foreground: "c97b7b" },   // dusty rose
      { token: "string.char",     foreground: "c97b7b" },
      { token: "string.escape",   foreground: "f0b060" },   // amber
      { token: "number",          foreground: "f0b060" },
      { token: "number.hex",      foreground: "f0b060" },
      { token: "operator",        foreground: "f2d5d5" },
      { token: "delimiter",       foreground: "c8a0a0" },
      { token: "identifier",      foreground: "f2d5d5" },
    ],
    colors: {
      "editor.background":              "#1a0d0d",
      "editor.foreground":              "#f2d5d5",
      "editorLineNumber.foreground":    "#4a2020",
      "editor.lineHighlightBackground": "#2e1414",
      "editorCursor.foreground":        "#e05252",
    },
  })

  // ── Theme: Rose ───────────────────────────────────────────────────
  monaco.editor.defineTheme("hs-rose", {
    base: "vs", inherit: true,
    rules: [
      { token: "comment",         foreground: "c06090", fontStyle: "italic" },
      { token: "keyword",         foreground: "d6006e" },   // deep pink
      { token: "type.identifier", foreground: "8844cc" },   // purple
      { token: "string",          foreground: "b8003a" },   // dark rose
      { token: "string.char",     foreground: "b8003a" },
      { token: "string.escape",   foreground: "cc5500" },   // warm amber
      { token: "number",          foreground: "9933aa" },   // violet
      { token: "number.hex",      foreground: "9933aa" },
      { token: "operator",        foreground: "5a1a3a" },
      { token: "delimiter",       foreground: "804060" },
      { token: "identifier",      foreground: "2d5a8a" },   // deep blue — readable on pink
    ],
    colors: {
      "editor.background":              "#fce8f3",
      "editor.foreground":              "#5a1a3a",
      "editorLineNumber.foreground":    "#e090c0",
      "editor.lineHighlightBackground": "#f0b8d8",
      "editorCursor.foreground":        "#d6006e",
    },
  })
}
