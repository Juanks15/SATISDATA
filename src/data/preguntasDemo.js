export const preguntasDemo = [
  {
    id: 1,
    codigo: 'SAT-001',
    orden: 1,
    texto: '¿En qué departamento se encuentra la comunidad?',
    tipo: 'select',
    obligatoria: true,
    opciones: [
      'Amazonas',
      'Chocó',
      'Guainía',
      'Guaviare',
      'La Guajira',
      'Vaupés',
      'Otro',
    ],
    activa: true,
  },

  {
    id: 2,
    codigo: 'SAT-002',
    orden: 2,
    texto: '¿Cuál es el nombre de la comunidad o localidad?',
    tipo: 'texto',
    obligatoria: true,
    activa: true,
  },

  {
    id: 3,
    codigo: 'SAT-003',
    orden: 3,
    texto:
      '¿Qué tan satisfecho está con el servicio de energía que recibe actualmente?',
    tipo: 'escala',
    obligatoria: true,
    minimo: 1,
    maximo: 5,
    activa: true,
  },

  {
    id: 4,
    codigo: 'SAT-004',
    orden: 4,
    texto:
      '¿Considera que el servicio de energía responde a las necesidades de su hogar o comunidad?',
    tipo: 'escala',
    obligatoria: true,
    minimo: 1,
    maximo: 5,
    activa: true,
  },

  {
    id: 5,
    codigo: 'SAT-005',
    orden: 5,
    texto:
      '¿Cómo considera la continuidad del servicio de energía?',
    tipo: 'select',
    obligatoria: true,
    opciones: [
      'Muy buena',
      'Buena',
      'Regular',
      'Mala',
      'Muy mala',
      'No sabe / No responde',
    ],
    activa: true,
  },

  {
    id: 6,
    codigo: 'SAT-006',
    orden: 6,
    texto:
      '¿Cómo califica la atención recibida por parte del personal?',
    tipo: 'escala',
    obligatoria: true,
    minimo: 1,
    maximo: 5,
    activa: true,
  },

  {
    id: 7,
    codigo: 'SAT-007',
    orden: 7,
    texto:
      '¿La información proporcionada durante la actividad fue clara y fácil de comprender?',
    tipo: 'escala',
    obligatoria: true,
    minimo: 1,
    maximo: 5,
    activa: true,
  },

  {
    id: 8,
    codigo: 'SAT-008',
    orden: 8,
    texto:
      '¿Considera que la solución energética ha mejorado las condiciones de vida de su comunidad?',
    tipo: 'select',
    obligatoria: true,
    opciones: [
      'Sí, mucho',
      'Sí, parcialmente',
      'No ha cambiado',
      'Ha empeorado',
      'No sabe / No responde',
    ],
    activa: true,
  },

  {
    id: 9,
    codigo: 'SAT-009',
    orden: 9,
    texto:
      '¿En cuáles actividades ha beneficiado principalmente el acceso a la energía?',
    tipo: 'multiple',
    obligatoria: true,
    opciones: [
      'Iluminación del hogar',
      'Educación / estudio',
      'Comunicación',
      'Actividades productivas',
      'Refrigeración y conservación de alimentos',
      'Actividades comunitarias',
      'Otra',
    ],
    activa: true,
  },

  {
    id: 10,
    codigo: 'SAT-010',
    orden: 10,
    texto:
      '¿Qué aspecto considera que debería mejorarse para beneficiar a su comunidad?',
    tipo: 'texto',
    obligatoria: false,
    activa: true,
  },
];