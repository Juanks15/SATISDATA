const fs = require('fs');
const path = require('path');

const BASE_URL =
  'https://geoportal.dane.gov.co/mparcgis/rest/services/Divipola/Serv_DIVIPOLA_MGN_2025/FeatureServer';

const DEPARTAMENTOS_URL = `${BASE_URL}/319/query`;
const MUNICIPIOS_URL = `${BASE_URL}/317/query`;

const outputDir = path.join(__dirname, '..', 'src', 'data');
const outputFile = path.join(outputDir, 'colombiaGeografia.js');

async function consultarDane(url, outFields) {
  const params = new URLSearchParams({
    where: '1=1',
    outFields,
    returnGeometry: 'false',
    f: 'json',
  });

  const response = await fetch(`${url}?${params.toString()}`);

  if (!response.ok) {
    throw new Error(
      `DANE respondió con HTTP ${response.status}`
    );
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(
      `DANE devolvió un error: ${JSON.stringify(data.error)}`
    );
  }

  if (!Array.isArray(data.features)) {
    throw new Error(
      'La respuesta del DANE no contiene la estructura esperada.'
    );
  }

  return data.features.map((feature) => feature.attributes);
}

function ordenarPorNombre(a, b) {
  return a.nombre.localeCompare(b.nombre, 'es');
}

async function generarCatalogo() {
  console.log('==========================================');
  console.log(' GENERADOR DE CATÁLOGO GEOGRÁFICO SATISDATA');
  console.log('==========================================');
  console.log('');
  console.log('Consultando DIVIPOLA oficial del DANE...');
  console.log('');

  try {
    const departamentosDane = await consultarDane(
      DEPARTAMENTOS_URL,
      'DPTO_CCDGO,DPTO_CNMBRE'
    );

    console.log(
      `Departamentos recibidos: ${departamentosDane.length}`
    );

    const municipiosDane = await consultarDane(
      MUNICIPIOS_URL,
      'DPTO_CCDGO,MPIO_CCDGO,MPIO_CDPMP,MPIO_CNMBRE'
    );

    console.log(
      `Municipios recibidos: ${municipiosDane.length}`
    );

    const departamentosMap = new Map();

    for (const item of departamentosDane) {
      const codigo = String(item.DPTO_CCDGO || '').trim();
      const nombre = String(item.DPTO_CNMBRE || '').trim();

      if (!codigo || !nombre) {
        continue;
      }

      departamentosMap.set(codigo, {
        codigo,
        nombre,
      });
    }

    const municipiosMap = new Map();

    for (const item of municipiosDane) {
      const codigoDepartamento = String(
        item.DPTO_CCDGO || ''
      ).trim();

      const codigoMunicipio = String(
        item.MPIO_CCDGO || ''
      ).trim();

      const codigoCompleto = String(
        item.MPIO_CDPMP || `${codigoDepartamento}${codigoMunicipio}`
      ).trim();

      const nombre = String(
        item.MPIO_CNMBRE || ''
      ).trim();

      if (
        !codigoDepartamento ||
        !codigoMunicipio ||
        !codigoCompleto ||
        !nombre
      ) {
        continue;
      }

      municipiosMap.set(codigoCompleto, {
        codigo: codigoMunicipio,
        codigoDepartamento,
        codigoCompleto,
        nombre,
      });
    }

    const departamentos = Array.from(
      departamentosMap.values()
    ).sort(ordenarPorNombre);

    const municipios = Array.from(
      municipiosMap.values()
    ).sort(ordenarPorNombre);

    if (departamentos.length === 0) {
      throw new Error(
        'No se encontraron departamentos en la respuesta del DANE.'
      );
    }

    if (municipios.length === 0) {
      throw new Error(
        'No se encontraron municipios en la respuesta del DANE.'
      );
    }

    const contenido = `// =====================================================
// CATÁLOGO GEOGRÁFICO DE COLOMBIA
// Generado desde DIVIPOLA MGN 2025 - DANE
// =====================================================
//
// Este archivo se utiliza localmente por SATISDATA
// para permitir funcionamiento offline.
//
// No editar manualmente.
// Para actualizar:
// node scripts/generarCatalogoColombia.cjs
// =====================================================

export const departamentos = ${JSON.stringify(
      departamentos,
      null,
      2
    )};

export const municipios = ${JSON.stringify(
      municipios,
      null,
      2
    )};
`;

    fs.mkdirSync(outputDir, {
      recursive: true,
    });

    fs.writeFileSync(
      outputFile,
      contenido,
      'utf8'
    );

    console.log('');
    console.log('CATÁLOGO GENERADO CORRECTAMENTE');
    console.log('');
    console.log(
      `Departamentos: ${departamentos.length}`
    );
    console.log(
      `Municipios: ${municipios.length}`
    );
    console.log('');
    console.log(
      `Archivo generado: ${outputFile}`
    );
    console.log('');
  } catch (error) {
    console.error('');
    console.error('ERROR GENERANDO CATÁLOGO:');
    console.error(error);
    console.error('');
    process.exit(1);
  }
}

generarCatalogo();