/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_APP_VERSION: string;
	readonly VITE_CHANGELOG: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
