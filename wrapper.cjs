// Este es un archivo CommonJS que carga un módulo ESM
(async () => {
  try {
    // Importa dinámicamente el módulo ESM
    const { default: app } = await import("./dist/app.js");

    // Si tu app exporta algo diferente, ajusta el código según sea necesario
    if (typeof app === "function") {
      // Si es una aplicación Express o similar
      module.exports = app;
    } else {
      // Si es otra cosa, simplemente exporta lo que sea
      module.exports = app;
    }
  } catch (error) {
    console.error("Error al cargar el módulo ESM:", error);
    process.exit(1);
  }
})();
