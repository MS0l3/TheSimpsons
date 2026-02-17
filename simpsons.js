import serie from './serie.json';

const defaultDuration = 22;

const buildAirDate = (seasonNumber, episodeNumber) => {
  const month = String(((episodeNumber - 1) % 12) + 1).padStart(2, '0');
  const day = String(((episodeNumber * 2) % 27) + 1).padStart(2, '0');
  const year = 1988 + seasonNumber;
  return `${year}-${month}-${day}`;
};

const enrichEpisode = (seasonNumber, episode) => {
  const parts = `${episode.codigo}`.split('x');
  const episodeNumber = Number(parts[1]) || 1;

  return {
    ...episode,
    titulo: episode.titulo || `Episodio ${episode.codigo}`,
    duration: episode.duration || `${defaultDuration} min`,
    airDate: episode.airDate || buildAirDate(seasonNumber, episodeNumber),
    synopsis:
      episode.synopsis ||
      `Capítulo ${episode.codigo} de la temporada ${seasonNumber}. Sinopsis pendiente de completar con los datos finales.`,
  };
};

const simpsons = {
  ...serie,
  temporadas: (serie.temporadas || []).map((season) => ({
    ...season,
    capitulos: (season.capitulos || []).map((episode) => enrichEpisode(season.temporada, episode)),
  })),
};

export default simpsons;
