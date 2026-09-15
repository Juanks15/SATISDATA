import { departamentos, municipios } from '../data/colombiaGeografia';

export async function obtenerDepartamentos() {
  return [...departamentos];
}

export async function obtenerMunicipios(codigoDepartamento) {
  if (!codigoDepartamento) {
    return [];
  }

  return municipios
    .filter(
      (municipio) =>
        municipio.codigoDepartamento === String(codigoDepartamento)
    )
    .sort((a, b) =>
      a.nombre.localeCompare(b.nombre, 'es')
    );
}