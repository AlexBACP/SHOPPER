/* Declaraciones de módulo para archivos que TypeScript no reconoce nativamente */

// Importaciones de CSS globales (side-effect imports)
declare module '*.css' {
  const styles: Record<string, string>;
  export default styles;
}
