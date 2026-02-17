import serie from './serie.json';

const simpsons = {
  ...serie,
  temporadas: (serie.temporadas || []).map((season) => ({
    ...season,
    capitulos: (season.capitulos || []).map((episode) => ({
      ...episode,
      title: episode.title ?? episode.titulo ?? '',
      duration: episode.duration ?? '',
      airDate: episode.airDate ?? '',
      synopsis: episode.synopsis ?? '',
    })),
  })),
};

export default simpsons;
