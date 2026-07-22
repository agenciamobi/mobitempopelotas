import type { Metadata } from "next";
import { ForecastPageShell } from "@/components/forecast-page-shell";
import { WeatherCameraExplorer } from "@/components/weather-camera-explorer";
import { absoluteUrl } from "@/lib/site";
import { getWeatherCameras } from "@/lib/weather-cameras";
import { getPelotasWeather } from "@/lib/weather-service";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const cameras = await getWeatherCameras();
  const hasOnlineCamera = cameras.some((camera) => camera.status === "online");

  return {
    title: hasOnlineCamera
      ? "Câmeras ao vivo de Pelotas e Praia do Laranjal"
      : "Câmeras de Pelotas e Praia do Laranjal",
    description: hasOnlineCamera
      ? "Acompanhe a transmissão atual ou mais recente da Praia do Laranjal e as câmeras disponíveis em Pelotas."
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
        ? "Veja imagens da Praia do Laranjal e acompanhe as condições do céu."
        : "Locais previstos para observação do tempo em Pelotas.",
      url: "/cameras-ao-vivo-pelotas",
    },
  };
}

export default async function CamerasAoVivoPelotasPage() {
  const [weather, cameras] = await Promise.all([
    getPelotasWeather(),
    getWeatherCameras(),
  ]);
  const onlineCount = cameras.filter((camera) => camera.status === "online").length;
  const liveCount = cameras.filter((camera) => camera.broadcastStatus === "live").length;

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
      title={onlineCount ? "Câmeras de Pelotas e do Laranjal" : "Câmeras de Pelotas"}
      description={
        onlineCount
          ? "Observe o céu, a visibilidade e a presença de chuva. No Laranjal, o portal mostra a transmissão ativa ou a gravação mais recente disponível no canal."
          : "As câmeras ainda não estão disponíveis. Os locais previstos são Laranjal, Centro e Canal São Gonçalo."
      }
      currentPath="/cameras-ao-vivo-pelotas"
      heroStat={{
        label: liveCount ? "Transmissões ao vivo agora" : "Câmeras disponíveis agora",
        value: liveCount || onlineCount,
        detail: liveCount
          ? liveCount === 1
            ? "ponto transmitindo ao vivo"
            : "pontos transmitindo ao vivo"
          : onlineCount === 1
            ? "ponto com imagem disponível"
            : "pontos com imagem disponível",
        ariaLabel: `${liveCount || onlineCount} câmeras disponíveis em Pelotas`,
        tone: "camera",
      }}
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
          <small>{liveCount ? `${liveCount} ao vivo` : onlineCount ? "Inclui a última transmissão disponível" : "Nenhuma câmera disponível"}</small>
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
            <h3>Confira o estado da transmissão</h3>
            <p>O player informa se a imagem está ao vivo ou se corresponde à gravação mais recente do canal.</p>
          </article>
        </div>
        <p className="data-note">
          As imagens pertencem aos responsáveis informados em cada câmera e podem ficar indisponíveis sem aviso.
        </p>
      </section>
    </ForecastPageShell>
  );
}
