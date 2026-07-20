import type { Metadata } from "next";
import { ForecastPageShell } from "@/components/forecast-page-shell";
import { WeatherCameraExplorer } from "@/components/weather-camera-explorer";
import { absoluteUrl } from "@/lib/site";
import { getWeatherCameras } from "@/lib/weather-cameras";
import { getPelotasWeather } from "@/lib/weather-service";

export const revalidate = 600;

export function generateMetadata(): Metadata {
  const hasOnlineCamera = getWeatherCameras().some(
    (camera) => camera.status === "online",
  );

  return {
    title: hasOnlineCamera
      ? "Câmeras ao vivo de Pelotas e Praia do Laranjal"
      : "Câmeras de Pelotas e Praia do Laranjal",
    description: hasOnlineCamera
      ? "Acompanhe câmeras de Pelotas, Praia do Laranjal e Canal São Gonçalo para observar chuva, nuvens e visibilidade."
      : "Veja os locais previstos para câmeras no Laranjal, Centro e Canal São Gonçalo.",
    alternates: { canonical: "/cameras-ao-vivo-pelotas" },
    robots: {
      index: hasOnlineCamera,
      follow: true,
    },
    openGraph: {
      title: hasOnlineCamera
        ? "Câmeras ao vivo de Pelotas"
        : "Câmeras de Pelotas",
      description: hasOnlineCamera
        ? "Veja imagens de diferentes pontos de Pelotas e acompanhe as condições do céu."
        : "Locais previstos para observação do tempo em Pelotas.",
      url: "/cameras-ao-vivo-pelotas",
    },
  };
}

export default async function CamerasAoVivoPelotasPage() {
  const weather = await getPelotasWeather();
  const cameras = getWeatherCameras();
  const onlineCount = cameras.filter((camera) => camera.status === "online").length;

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Câmeras de Pelotas",
    url: absoluteUrl("/cameras-ao-vivo-pelotas"),
    numberOfItems: cameras.length,
    itemListElement: cameras.map((camera, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: camera.name,
      description: camera.description,
      item: `${absoluteUrl("/cameras-ao-vivo-pelotas")}#${camera.id}`,
    })),
  };

  return (
    <ForecastPageShell
      weather={weather}
      eyebrow="Veja Pelotas pelas câmeras"
      title={onlineCount ? "Câmeras ao vivo de Pelotas" : "Câmeras de Pelotas"}
      description={
        onlineCount
          ? "Observe o céu, a visibilidade e a presença de chuva em diferentes pontos da cidade."
          : "As câmeras ainda não estão disponíveis. Os locais previstos são Laranjal, Centro e Canal São Gonçalo."
      }
      currentPath="/cameras-ao-vivo-pelotas"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(itemListSchema).replace(/</g, "\\u003c"),
        }}
      />

      <section className="camera-overview" aria-label="Resumo das câmeras">
        <article>
          <span>Locais previstos</span>
          <strong>{cameras.length}</strong>
          <small>Laranjal, Centro e São Gonçalo</small>
        </article>
        <article>
          <span>Disponíveis agora</span>
          <strong>{onlineCount}</strong>
          <small>{onlineCount ? "Câmeras funcionando" : "Nenhuma câmera disponível no momento"}</small>
        </article>
        <article>
          <span>Temperatura agora</span>
          <strong>{weather.current.temperature}°C</strong>
          <small>{weather.current.condition}</small>
        </article>
        <article>
          <span>Rajada mais forte nas próximas horas</span>
          <strong>
            {Math.max(
              weather.current.windGust,
              ...weather.hourly.map((hour) => hour.windGust),
            )} km/h
          </strong>
          <small>Previsão para Pelotas</small>
        </article>
      </section>

      <WeatherCameraExplorer cameras={cameras} />

      <section className="topic-section camera-guidance" aria-labelledby="camera-guidance-title">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Use as imagens como apoio</span>
            <h2 id="camera-guidance-title">A câmera mostra o local, mas não mede o tempo</h2>
          </div>
          <p>
            A imagem ajuda a perceber neblina, nuvens e chuva, mas deve ser consultada junto da previsão e dos avisos oficiais.
          </p>
        </div>
        <div className="camera-guidance-grid">
          <article>
            <span>01</span>
            <h3>Observe a visibilidade</h3>
            <p>Neblina, chuva forte e nuvens baixas podem dificultar a visão do horizonte.</p>
          </article>
          <article>
            <span>02</span>
            <h3>Compare com a previsão</h3>
            <p>Veja também as páginas de chuva, vento e temperatura do portal.</p>
          </article>
          <article>
            <span>03</span>
            <h3>A imagem pode atrasar</h3>
            <p>A câmera pode pausar, ficar fora do ar ou mostrar uma imagem com alguns segundos de atraso.</p>
          </article>
        </div>
        <p className="data-note">
          As imagens pertencem aos responsáveis informados em cada câmera e podem ficar indisponíveis sem aviso.
        </p>
      </section>
    </ForecastPageShell>
  );
}
