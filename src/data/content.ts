export interface Asset {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  thumbnailUrl: string;
  year?: number;
  genre?: string;
  duration?: string;
  rating?: string;
}

export interface ContentCategory {
  id: string;
  title: string;
  assets: Asset[];
}

const createAsset = (
  id: string,
  title: string,
  description: string,
  year: number,
  genre: string,
  duration: string,
  rating: string
): Asset => ({
  id,
  title,
  description,
  imageUrl: `https://picsum.photos/seed/${id}/1920/1080`,
  thumbnailUrl: `https://picsum.photos/seed/${id}/300/170`,
  year,
  genre,
  duration,
  rating,
});

const recomendadosAssets: Asset[] = [
  createAsset('rec-1', 'El Último Horizonte', 'Un astronauta perdido en el espacio profundo debe encontrar el camino a casa.', 2023, 'Ciencia Ficción', '2h 15m', 'PG-13'),
  createAsset('rec-2', 'Sombras del Pasado', 'Un detective investiga crímenes que parecen conectados con su propio pasado.', 2022, 'Thriller', '1h 58m', 'R'),
  createAsset('rec-3', 'La Gran Aventura', 'Un grupo de amigos emprende un viaje épico por tierras desconocidas.', 2023, 'Aventura', '2h 05m', 'PG'),
  createAsset('rec-4', 'Corazón de Acero', 'La historia de un soldado que regresa a casa después de años de guerra.', 2021, 'Drama', '2h 30m', 'R'),
  createAsset('rec-5', 'Risas en Familia', 'Una comedia entrañable sobre los altibajos de la vida familiar moderna.', 2023, 'Comedia', '1h 45m', 'PG'),
  createAsset('rec-6', 'El Código Secreto', 'Un hacker descubre una conspiración global que amenaza la democracia.', 2022, 'Acción', '2h 10m', 'PG-13'),
  createAsset('rec-7', 'Amor en París', 'Una historia de amor que nace entre dos desconocidos en la ciudad de la luz.', 2023, 'Romance', '1h 52m', 'PG-13'),
  createAsset('rec-8', 'El Bosque Oscuro', 'Un grupo de exploradores se adentra en un bosque del que nadie regresa.', 2022, 'Terror', '1h 40m', 'R'),
];

const peliculasAssets: Asset[] = [
  createAsset('pel-1', 'Velocidad Máxima', 'Un piloto de carreras enfrenta el desafío de su vida en la pista más peligrosa del mundo.', 2023, 'Acción', '2h 00m', 'PG-13'),
  createAsset('pel-2', 'La Herencia', 'Una familia descubre secretos oscuros tras la muerte de su patriarca.', 2022, 'Misterio', '2h 20m', 'R'),
  createAsset('pel-3', 'Mundos Paralelos', 'Un científico abre una puerta a dimensiones alternativas con consecuencias imprevistas.', 2023, 'Ciencia Ficción', '2h 35m', 'PG-13'),
  createAsset('pel-4', 'El Chef Perfecto', 'La historia de un cocinero que busca la receta perfecta para conquistar el mundo.', 2021, 'Drama', '1h 55m', 'PG'),
  createAsset('pel-5', 'Noche de Lobos', 'Una detective enfrenta a una manada de criminales en una noche de caos urbano.', 2022, 'Thriller', '1h 48m', 'R'),
  createAsset('pel-6', 'El Último Samurái', 'Un guerrero solitario defiende su aldea de invasores con honor y valentía.', 2023, 'Acción', '2h 15m', 'PG-13'),
  createAsset('pel-7', 'Sueños de Verano', 'Un adolescente vive el verano más memorable de su vida en un pequeño pueblo costero.', 2022, 'Drama', '1h 42m', 'PG'),
  createAsset('pel-8', 'La Tormenta Perfecta', 'Un equipo de meteorólogos intenta salvar una ciudad de un huracán devastador.', 2023, 'Acción', '2h 08m', 'PG-13'),
];

const seriesAssets: Asset[] = [
  createAsset('ser-1', 'Imperios Caídos', 'Una saga épica sobre el ascenso y caída de civilizaciones antiguas.', 2022, 'Historia', '8 temporadas', 'TV-MA'),
  createAsset('ser-2', 'Código Rojo', 'Un equipo de médicos de urgencias enfrenta casos imposibles cada semana.', 2023, 'Drama Médico', '5 temporadas', 'TV-14'),
  createAsset('ser-3', 'La Agencia', 'Los secretos de una agencia de espionaje internacional salen a la luz.', 2021, 'Espionaje', '3 temporadas', 'TV-MA'),
  createAsset('ser-4', 'Familia Total', 'Las aventuras cotidianas de una familia disfuncional pero adorable.', 2023, 'Comedia', '6 temporadas', 'TV-PG'),
  createAsset('ser-5', 'El Abismo', 'Científicos marinos descubren vida inteligente en las profundidades del océano.', 2022, 'Ciencia Ficción', '2 temporadas', 'TV-14'),
  createAsset('ser-6', 'Crimen Perfecto', 'Un criminólogo analiza los casos más complejos de la historia criminal.', 2023, 'Crimen', '4 temporadas', 'TV-MA'),
  createAsset('ser-7', 'Nuevos Mundos', 'Colonos en un planeta lejano luchan por sobrevivir y construir una nueva civilización.', 2022, 'Ciencia Ficción', '3 temporadas', 'TV-14'),
  createAsset('ser-8', 'El Restaurante', 'Drama y pasión en la cocina de un restaurante de alta gama en Madrid.', 2023, 'Drama', '4 temporadas', 'TV-14'),
];

const accionAssets: Asset[] = [
  createAsset('acc-1', 'Fuerza Bruta', 'Un ex-soldado de élite regresa para salvar a su ciudad del crimen organizado.', 2023, 'Acción', '1h 58m', 'R'),
  createAsset('acc-2', 'Misión Imposible: Origen', 'El origen de la agencia de operaciones especiales más secreta del mundo.', 2022, 'Acción', '2h 25m', 'PG-13'),
  createAsset('acc-3', 'Tormenta de Fuego', 'Bomberos de élite combaten un incendio forestal que amenaza con destruir una ciudad.', 2023, 'Acción', '2h 05m', 'PG-13'),
  createAsset('acc-4', 'El Cazador', 'Un cazarrecompensas persigue al criminal más buscado del mundo por tres continentes.', 2021, 'Acción', '1h 52m', 'R'),
  createAsset('acc-5', 'Zona de Guerra', 'Soldados atrapados detrás de líneas enemigas deben encontrar la salida.', 2022, 'Acción', '2h 18m', 'R'),
  createAsset('acc-6', 'Velocidad Letal', 'Un conductor de coches blindados protege a testigos en situaciones extremas.', 2023, 'Acción', '1h 45m', 'PG-13'),
  createAsset('acc-7', 'El Guardaespaldas', 'Un agente de seguridad protege a una cantante amenazada de muerte.', 2022, 'Acción', '2h 00m', 'PG-13'),
  createAsset('acc-8', 'Asalto Final', 'Un equipo de operaciones especiales debe neutralizar una amenaza nuclear.', 2023, 'Acción', '2h 12m', 'R'),
];

const comediaAssets: Asset[] = [
  createAsset('com-1', 'Mi Vecino el Millonario', 'Un hombre de clase media descubre que su nuevo vecino es un excéntrico multimillonario.', 2023, 'Comedia', '1h 38m', 'PG'),
  createAsset('com-2', 'La Boda del Siglo', 'Los preparativos de una boda se convierten en un caos total y divertido.', 2022, 'Comedia Romántica', '1h 52m', 'PG-13'),
  createAsset('com-3', 'Papá por Accidente', 'Un soltero empedernido descubre que es padre de trillizos de cinco años.', 2023, 'Comedia', '1h 45m', 'PG'),
  createAsset('com-4', 'El Jefe Loco', 'Un empleado modelo debe lidiar con el jefe más extravagante del mundo empresarial.', 2021, 'Comedia', '1h 40m', 'PG-13'),
  createAsset('com-5', 'Vacaciones en Caos', 'Una familia planea las vacaciones perfectas que resultan ser un desastre épico.', 2022, 'Comedia', '1h 55m', 'PG'),
  createAsset('com-6', 'El Intercambio', 'Dos rivales de negocios intercambian sus vidas por una semana con resultados hilarantes.', 2023, 'Comedia', '1h 48m', 'PG-13'),
  createAsset('com-7', 'Superhéroes de Barrio', 'Un grupo de vecinos decide convertirse en superhéroes para proteger su comunidad.', 2022, 'Comedia', '1h 42m', 'PG'),
  createAsset('com-8', 'La Reunión', 'Antiguos compañeros de universidad se reúnen veinte años después con sorpresas inesperadas.', 2023, 'Comedia', '1h 50m', 'PG-13'),
];

export const CATEGORIES: ContentCategory[] = [
  {
    id: 'recomendados',
    title: 'Recomendados',
    assets: recomendadosAssets,
  },
  {
    id: 'peliculas',
    title: 'Películas',
    assets: peliculasAssets,
  },
  {
    id: 'series',
    title: 'Series',
    assets: seriesAssets,
  },
  {
    id: 'accion',
    title: 'Acción',
    assets: accionAssets,
  },
  {
    id: 'comedia',
    title: 'Comedia',
    assets: comediaAssets,
  },
];

export const DEFAULT_ASSET: Asset = recomendadosAssets[0];
