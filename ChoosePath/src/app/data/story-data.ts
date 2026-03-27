/**
 * Story Data - Complete story content for "El Galeón de la Niebla"
 * 
 * This file contains all story nodes, choices, events, and narrative content.
 * Organized by story branches (Rama A, B, C).
 */

import { StoryNode, Choice, EventItem } from '../models/story.model';

/**
 * Choice definitions for the root node
 */
const ROOT_CHOICES: Choice[] = [
  { key: 'A', text: 'Acercarte a la figura del muelle siete' },
  { key: 'B', text: 'Abordar a Drace antes de que zarpe' },
  { key: 'C', text: 'Colarte en la bodega del Viento Ciego' },
];

/**
 * Story nodes mapped by their ID
 * Each node contains scene text, choices, events, and memory triggers
 */
export const STORY_NODES: Record<string, StoryNode> = {
  
  // =====================================================================
  // ROOT NODE - Starting point of the story
  // =====================================================================
  root: {
    id: 'root',
    label: 'Puerto',
    scene: `El alba tiñe Portum Velorum de color melocotón y sal. Los estibadores maldicen en tres idiomas mientras los galeones mecen sus cadenas. Junto al farol del muelle siete, una figura encapuchada te observa fijamente. Al fondo, el Capitán Drace supervisa la carga del <em>Viento Ciego</em> sin apartar la mano de su pistola. Aún no te ha visto.`,
    choices: ROOT_CHOICES,
    events: [],
    memoryKeys: [],
    childIds: [],
  },

  // =====================================================================
  // BRANCH A: Mira and the Seal
  // =====================================================================
  'Acercarte a la figura del muelle siete': {
    id: '',
    label: 'Mira',
    scene: `La figura aparta la capucha. Es Mira Solano —espía de la Corona que creías muerta en el naufragio de Tarsis hace dos años. Cicatriz fresca desde la ceja izquierda hasta el mentón. Te empuja hacia las sombras y habla deprisa: <em>"El Almirante Kael vende información a los rebeldes. Lleva este sello al Juez Harren de Isla Negra. Nadie más lo puede abrir."</em> Te pone en la palma un disco de lacre negro con un sello de cuervo. Desaparece antes de que puedas responder.`,
    choices: [
      { key: 'A', text: 'Buscar a Drace para cruzar a Isla Negra' },
      { key: 'B', text: 'Romper el sello y leer el mensaje' },
      { key: 'C', text: 'Seguir a Mira entre la niebla' },
    ],
    events: [
      { type: 'mystery', who: 'Mira Solano', description: 'Viva. Dos años desaparecida. La cicatriz es de interrogatorio reciente.' },
      { type: 'event', who: 'Sello de cuervo', description: 'Lacre negro. Solo el Juez Harren puede abrirlo legítimamente.' },
    ],
    memoryKeys: ['mira_viva', 'kael_traidor'],
    childIds: [],
  },

  'Buscar a Drace para cruzar a Isla Negra': {
    id: '',
    label: 'Drace-A',
    scene: `Drace te escucha con los ojos entornados. Lleva el nombre del Almirante Kael tatuado en el antebrazo —símbolo de viejo juramento de lealtad marina. Mira el bulto en tu bolsillo. <em>"Doce monedas de oro o el sello. Elige."</em> Alguien del puerto ya le dijo que ibas a venir.`,
    choices: [
      { key: 'A', text: 'Pagar las doce monedas y conservar el sello' },
      { key: 'B', text: 'Negarte: buscar otro barco' },
      { key: 'C', text: 'Acusar a Drace de espionaje en voz alta' },
    ],
    events: [
      { type: 'enemy', who: 'Capitan Drace', description: 'Conoce el sello antes de que hablaras. Fue avisado.' },
      { type: 'warning', who: 'Tatuaje de Kael', description: 'Drace lleva el nombre del Almirante. Lealtad antigua, quizás activa.' },
    ],
    memoryKeys: ['drace_informado', 'drace_kael'],
    childIds: [],
  },

  'Pagar las doce monedas y conservar el sello': {
    id: '',
    label: 'En Mar',
    scene: `El Viento Ciego zarpa al mediodía. Esa noche, en alta mar, Drace baja a tu camarote. Cierra la puerta. <em>"Voy a ser directo contigo. El Almirante Kael me paga para saber quién lleva mensajes a Harren. Puedo olvidar que existes por veinte monedas más, o puedo recordarlo perfectamente."</em> Una pausa. <em>"Tú decides."</em>`,
    choices: [
      { key: 'A', text: 'Pagar las veinte monedas adicionales' },
      { key: 'B', text: 'Atacar a Drace y tomar el control' },
      { key: 'C', text: 'Revelar el contenido del sello para negociar' },
    ],
    events: [
      { type: 'enemy', who: 'Capitan Drace', description: 'Confirmado: trabaja para Kael. El pasaje fue una trampa.' },
      { type: 'warning', who: 'Alta mar', description: 'Sin escapatoria. Isla Negra aún a doce horas.' },
    ],
    memoryKeys: ['drace_agente_kael', 'trampa_barco'],
    childIds: [],
  },

  'Romper el sello y leer el mensaje': {
    id: '',
    label: 'El Mensaje',
    scene: `El lacre cede. Tres nombres escritos con tinta roja. Una fecha: <em>mañana al amanecer.</em> Almirante Kael. Juez Harren. Y el tuyo. No eres el mensajero. Eres el tercero en la lista de eliminación. Mira fue engañada para entregarte el pergamino —o tú fuiste engañado para recibirlo.`,
    choices: [
      { key: 'A', text: 'Correr a advertir a Mira del engaño' },
      { key: 'B', text: 'Destruir el pergamino y huir del puerto' },
      { key: 'C', text: 'Ir directamente al Almirante Kael' },
    ],
    events: [
      { type: 'warning', who: 'Lista roja', description: 'Tu nombre en la lista junto a Kael y Harren. Objetivo, no enviado.' },
      { type: 'mystery', who: 'Autor desconocido', description: 'Quien escribió esto conocía tu identidad. Planificó con días de antelación.' },
    ],
    memoryKeys: ['eres_objetivo', 'sello_roto'],
    childIds: [],
  },

  'Seguir a Mira entre la niebla': {
    id: '',
    label: 'Trampa',
    scene: `La sigues tres minutos entre callejones de carga. Cuando la niebla se espesa junto a los almacenes de popa, Mira se detiene. No está sola: dos guardias con uniformes de la armada real la flanquean. Se gira hacia ti muy despacio: <em>"Lo siento. No tuve alternativa."</em>`,
    choices: [
      { key: 'A', text: 'Luchar para abrirte paso al muelle' },
      { key: 'B', text: 'Lanzar el sello al mar y rendirte' },
      { key: 'C', text: 'Exigir hablar con el oficial superior' },
    ],
    events: [
      { type: 'enemy', who: 'Guardia Izquierda', description: 'Bloquea la salida al embarcadero. Espada a medias.' },
      { type: 'enemy', who: 'Guardia Derecha', description: 'Cierra el callejón. Grilletes en el cinto.' },
      { type: 'warning', who: 'Mira Solano', description: 'Señuelo. El sello que entregó es falso, de cera pintada.' },
    ],
    memoryKeys: ['mira_seneuelo', 'sello_falso', 'trampa_armada'],
    childIds: [],
  },

  // =====================================================================
  // BRANCH B: Drace and the Alliance
  // =====================================================================
  'Abordar a Drace antes de que zarpe': {
    id: '',
    label: 'Cubierta',
    scene: `Subes la pasarela sin que nadie te detenga. Drace lo observa y sonríe de lado. <em>"Tienes agallas, eso sí."</em> La cubierta del Viento Ciego huele a pólvora nueva. dos marineros con traza de mercenarios vigilan la escotilla de popa. Drace te tiende un vaso de aguardiente sin preguntar nada. Solo espera.`,
    choices: [
      { key: 'A', text: 'Pedirle pasaje discreto a Isla Negra' },
      { key: 'B', text: 'Preguntarle sobre el Almirante Kael' },
      { key: 'C', text: 'Ofrecerte como tripulante hasta Isla Negra' },
    ],
    events: [
      { type: 'event', who: 'Capitan Drace', description: 'Respeta la audacia. Espera en silencio. Trato posible.' },
      { type: 'warning', who: 'Mercenarios en escotilla', description: 'No son marineros normales. Están armados y nerviosos.' },
    ],
    memoryKeys: ['drace_respeto', 'mercenarios_bordo'],
    childIds: [],
  },

  'Preguntarle sobre el Almirante Kael': {
    id: '',
    label: 'El Nombre',
    scene: `El vaso se detiene a mitad de camino. Los dos mercenarios de la escotilla intercambian una mirada rápida. Drace baja la voz: <em>"Kael cerró mis rutas del norte hace siete meses. Decomisó dos barcos. Arruinó a mi familia."</em> Pausa. <em>"Pero hay gente que paga bien por saber dónde está y cuándo mueve sus fichas. ¿Tú eres uno de esos?"</em>`,
    choices: [
      { key: 'A', text: 'Confirmar que buscas a Kael y proponer alianza' },
      { key: 'B', text: 'Negar cualquier relación con Kael' },
      { key: 'C', text: 'Ofrecerle oro por su información ahora mismo' },
    ],
    events: [
      { type: 'event', who: 'Capitan Drace', description: 'Arruinado por Kael. Motivos propios para traicionarlo.' },
      { type: 'mystery', who: 'Informacion de Kael', description: 'Drace tiene datos de movimientos. Fuente potencialmente valiosa.' },
    ],
    memoryKeys: ['drace_vs_kael', 'drace_intel'],
    childIds: [],
  },

  'Confirmar que buscas a Kael y proponer alianza': {
    id: '',
    label: 'Alianza',
    scene: `Drace estrecha la mano con la firmeza de quien firma en sangre. Baja a su cabina de mapas. Sobre la mesa, una carta náutica con un círculo rojo alrededor de un archipiélago sin nombre. <em>"Kael tiene aquí veinte barcos de guerra. Suficiente para tomar la capital si la flota real está dispersa en el sur."</em> Clava la vista en ti. <em>"¿Sigues queriéndolo encontrar?"</em>`,
    choices: [
      { key: 'A', text: 'Zarpar ya con Drace hacia el archipiélago' },
      { key: 'B', text: 'Pedir 48 horas para buscar refuerzos en la ciudad' },
      { key: 'C', text: 'Exigir prueba física de que la flota existe' },
    ],
    events: [
      { type: 'event', who: 'Capitan Drace', description: 'Aliado formal. Zarpa en dos horas.' },
      { type: 'warning', who: 'Flota de Kael', description: '20 barcos. Archipiélago sin nombre en carta oficial.' },
      { type: 'mystery', who: 'Carta manipulada', description: 'El archipiélago fue borrado de los registros de la Corona. Alguien con acceso lo hizo.' },
    ],
    memoryKeys: ['alianza_drace', 'flota_kael', 'archipielago_borrado'],
    childIds: [],
  },

  'Zarpar ya con Drace hacia el archipielago': {
    id: '',
    label: 'Alta Mar',
    scene: `El viento llena las velas al atardecer. Al tercer día, un barco de vigía de Kael aparece en el horizonte y cambia el rumbo hacia vosotros. Drace ordena izar una bandera de mercante neutral. <em>"Si nos abordan, eres mi cocinero. Un cocinero mudo, si puedes."</em> El barco enemigo se acerca. Ocho cañones apuntando.`,
    choices: [
      { key: 'A', text: 'Mantener la tapadera de cocinero' },
      { key: 'B', text: 'Disparar primero y escapar' },
      { key: 'C', text: 'Rendirse y usar la captura como acceso al archipiélago' },
    ],
    events: [
      { type: 'enemy', who: 'Barco vigia de Kael', description: '8 cañones. Abordaje inminente si no se convencen.' },
      { type: 'event', who: 'Bandera neutral', description: 'Tapadera activada. Todo depende de que la historia se sostenga.' },
    ],
    memoryKeys: ['interceptados', 'tapadera_mercante'],
    childIds: [],
  },

  // =====================================================================
  // BRANCH C: The Hold and the Prisoners
  // =====================================================================
  'Colarte en la bodega del Viento Ciego': {
    id: '',
    label: 'Bodega',
    scene: `Cedro húmedo y olor a salitre. Entre los barriles de pólvora encuentras algo que no esperabas: tres hombres con uniformes desgarrados de oficiales navales de la Corona, encadenados a la quilla. Uno te reconoce —sus ojos se abren de par en par— y mueve la cabeza hacia la escotilla con urgencia. Pasos en cubierta. Alguien baja.`,
    choices: [
      { key: 'A', text: 'Esconderte detrás de los barriles de pólvora' },
      { key: 'B', text: 'Cortar la mordaza al oficial que te reconoció' },
      { key: 'C', text: 'Sacar el cuchillo y esperar al que baja' },
    ],
    events: [
      { type: 'enemy', who: 'Prisioneros navales', description: 'Tres oficiales de la Corona encadenados en bodega de barco mercante.' },
      { type: 'warning', who: 'Escotilla', description: 'Alguien baja ahora. Cinco segundos para esconderte o actuar.' },
    ],
    memoryKeys: ['prisioneros_bodega', 'oficial_reconcio'],
    childIds: [],
  },

  'Cortar la mordaza al oficial que te reconoció': {
    id: '',
    label: 'Cdr. Veris',
    scene: `Jadea. Susurro urgente y preciso: <em>"Comandante Veris, Flota del Norte. Este barco lleva armas al Archipiélago de las Almas bajo órdenes del Almirante Kael. Si la Flota Real no llega allí antes del amanecer de pasado mañana, los rebeldes tienen suficiente para tomar el Estrecho del Rey."</em> Los pasos se detienen sobre vuestra cabeza.`,
    choices: [
      { key: 'A', text: 'Liberar a Veris y los tres oficiales ahora' },
      { key: 'B', text: 'Pedirle que espere — necesitas más información' },
      { key: 'C', text: 'Usar la info para negociar con Drace' },
    ],
    events: [
      { type: 'event', who: 'Cdr. Veris', description: 'Drace es agente de Kael. Las armas en bodega son para la flota rebelde.' },
      { type: 'warning', who: 'Plazo', description: 'Pasado mañana al amanecer. Horas contadas para avisar a la Flota Real.' },
      { type: 'mystery', who: 'Archipielago de las Almas', description: 'La misma ubicación sin nombre de la carta de Drace. Base de Kael.' },
    ],
    memoryKeys: ['drace_agente_kael', 'plazo_critico', 'mismo_archipielago'],
    childIds: [],
  },

  'Liberar a Veris y los tres oficiales ahora': {
    id: '',
    label: 'Motin',
    scene: `Las cadenas ceden. Veris se pone en pie con dificultad pero con determinación en los ojos. Con cuatro personas tienes opciones que no tenías antes. Cuenta los pasos sobre vuestra cabeza: tres guardias en cubierta, Drace en el puente. <em>"Necesitamos el timón y el libro de señales,"</em> dice Veris en voz muy baja. <em>"El resto es fuerza bruta."</em>`,
    choices: [
      { key: 'A', text: 'Subir por la escotilla de proa en silencio' },
      { key: 'B', text: 'Crear distracción incendiando un barril pequeño' },
      { key: 'C', text: 'Enviar a Veris arriba mientras tú retienes la escotilla' },
    ],
    events: [
      { type: 'event', who: 'Cdr. Veris', description: 'Operativo. Objetivo: timón y libro de señales para enviar aviso a la Flota Real.' },
      { type: 'warning', who: 'Guardia de cubierta', description: 'Tres en cubierta. Drace en el puente. Todos armados.' },
    ],
    memoryKeys: ['veris_libre', 'motin_activo'],
    childIds: [],
  },

  'Esconderte detrás de los barriles de pólvora': {
    id: '',
    label: 'Escondido',
    scene: `Te aplastas entre dos barriles. Un marinero de cuello ancho baja con un farol, revisa el inventario durante tres minutos eternos y vuelve a subir sin mirarte. Cuando el silencio vuelve, el oficial que te reconoció te mira con los ojos muy abiertos y señala su oído con el mentón: <em>están escuchando arriba.</em>`,
    choices: [
      { key: 'A', text: 'Esperar a que anochezca para actuar' },
      { key: 'B', text: 'Cortar la mordaza del oficial ahora mismo' },
      { key: 'C', text: 'Intentar escapar del barco antes de que zarpe' },
    ],
    events: [
      { type: 'event', who: 'Marinero', description: 'Revisión de inventario rutinaria. No te vio. Pero volverá.' },
      { type: 'mystery', who: 'Oficial prisionero', description: 'Señala hacia arriba. Hay alguien escuchando en el sollado.' },
    ],
    memoryKeys: ['no_detectado', 'espias_arriba'],
    childIds: [],
  },
};

/**
 * Database lookup by choice text
 * Maps choice text to full node data
 */
export const CHOICE_DATABASE: Record<string, Omit<StoryNode, 'id' | 'childIds' | 'depth'>> = {
  // Root choices
  [STORY_NODES['root'].choices[0].text]: STORY_NODES['Acercarte a la figura del muelle siete'],
  [STORY_NODES['root'].choices[1].text]: STORY_NODES['Abordar a Drace antes de que zarpe'],
  [STORY_NODES['root'].choices[2].text]: STORY_NODES['Colarte en la bodega del Viento Ciego'],

  // Branch A: Mira and the Seal
  'Acercarte a la figura del muelle siete': STORY_NODES['Acercarte a la figura del muelle siete'],
  'Buscar a Drace para cruzar a Isla Negra': STORY_NODES['Buscar a Drace para cruzar a Isla Negra'],
  'Romper el sello y leer el mensaje': STORY_NODES['Romper el sello y leer el mensaje'],
  'Seguir a Mira entre la niebla': STORY_NODES['Seguir a Mira entre la niebla'],

  // Branch A-1: Buscar a Drace
  'Pagar las doce monedas y conservar el sello': STORY_NODES['Pagar las doce monedas y conservar el sello'],
  'Negarte: buscar otro barco': STORY_NODES['Buscar a Drace para cruzar a Isla Negra'], // Fallback
  'Acusar a Drace de espionaje en voz alta': STORY_NODES['Buscar a Drace para cruzar a Isla Negra'], // Fallback

  // Branch A-2: Romper el sello
  'Correr a advertir a Mira del engaño': STORY_NODES['Romper el sello y leer el mensaje'], // Fallback
  'Destruir el pergamino y huir del puerto': STORY_NODES['Romper el sello y leer el mensaje'], // Fallback
  'Ir directamente al Almirante Kael': STORY_NODES['Romper el sello y leer el mensaje'], // Fallback

  // Branch A-3: Seguir a Mira
  'Luchar para abrirte paso al muelle': STORY_NODES['Seguir a Mira entre la niebla'], // Fallback
  'Lanzar el sello al mar y rendirte': STORY_NODES['Seguir a Mira entre la niebla'], // Fallback
  'Exigir hablar con el oficial superior': STORY_NODES['Seguir a Mira entre la niebla'], // Fallback

  // Branch B: Drace and the Alliance
  'Abordar a Drace antes de que zarpe': STORY_NODES['Abordar a Drace antes de que zarpe'],
  'Pedirle pasaje discreto a Isla Negra': STORY_NODES['Abordar a Drace antes de que zarpe'], // Fallback
  'Preguntarle sobre el Almirante Kael': STORY_NODES['Preguntarle sobre el Almirante Kael'],
  'Ofrecerte como tripulante hasta Isla Negra': STORY_NODES['Abordar a Drace antes de que zarpe'], // Fallback

  // Branch B-1: Preguntar sobre Kael
  'Confirmar que buscas a Kael y proponer alianza': STORY_NODES['Confirmar que buscas a Kael y proponer alianza'],
  'Negar cualquier relación con Kael': STORY_NODES['Preguntarle sobre el Almirante Kael'], // Fallback
  'Ofrecerle oro por su información ahora mismo': STORY_NODES['Preguntarle sobre el Almirante Kael'], // Fallback

  // Branch B-1-1: Confirmar alianza
  'Zarpar ya con Drace hacia el archipielago': STORY_NODES['Zarpar ya con Drace hacia el archipielago'],
  'Pedir 48 horas para buscar refuerzos en la ciudad': STORY_NODES['Confirmar que buscas a Kael y proponer alianza'], // Fallback
  'Exigir prueba física de que la flota existe': STORY_NODES['Confirmar que buscas a Kael y proponer alianza'], // Fallback

  // Branch B-1-1-1: Zarpar
  'Mantener la tapadera de cocinero': STORY_NODES['Zarpar ya con Drace hacia el archipielago'], // Fallback
  'Disparar primero y escapar': STORY_NODES['Zarpar ya con Drace hacia el archipielago'], // Fallback
  'Rendirse y usar la captura como acceso al archipiélago': STORY_NODES['Zarpar ya con Drace hacia el archipielago'], // Fallback

  // Branch C: The Hold and the Prisoners
  'Colarte en la bodega del Viento Ciego': STORY_NODES['Colarte en la bodega del Viento Ciego'],
  'Esconderte detrás de los barriles de pólvora': STORY_NODES['Esconderte detrás de los barriles de pólvora'],
  'Cortar la mordaza al oficial que te reconoció': STORY_NODES['Cortar la mordaza al oficial que te reconoció'],
  'Sacar el cuchillo y esperar al que baja': STORY_NODES['Colarte en la bodega del Viento Ciego'], // Fallback

  // Branch C-1: Cortar la mordaza
  'Liberar a Veris y los tres oficiales ahora': STORY_NODES['Liberar a Veris y los tres oficiales ahora'],
  "Pedirle que espere — necesitas más información": STORY_NODES['Cortar la mordaza al oficial que te reconoció'], // Fallback
  'Usar la info para negociar con Drace': STORY_NODES['Cortar la mordaza al oficial que te reconoció'], // Fallback

  // Branch C-1-1: Liberar a Veris
  'Subir por la escotilla de proa en silencio': STORY_NODES['Liberar a Veris y los tres oficiales ahora'], // Fallback
  'Crear distracción incendiando un barril pequeño': STORY_NODES['Liberar a Veris y los tres oficiales ahora'], // Fallback
  'Enviar a Veris arriba mientras tú retienes la escotilla': STORY_NODES['Liberar a Veris y los tres oficiales ahora'], // Fallback

  // Branch C-2: Esconderse
  'Esperar a que anochezca para actuar': STORY_NODES['Esconderte detrás de los barriles de pólvora'], // Fallback
  'Cortar la mordaza del oficial ahora mismo': STORY_NODES['Cortar la mordaza al oficial que te reconoció'],
  'Intentar escapar del barco antes de que zarpe': STORY_NODES['Esconderte detrás de los barriles de pólvora'], // Fallback
};

/**
 * Creates a deep clone of the root node for story initialization
 */
export function createRootNode(): StoryNode {
  return {
    ...structuredClone(STORY_NODES['root']),
    childIds: [],
  };
}
