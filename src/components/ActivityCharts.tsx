import LineChart from "./LineChart";
import { SectionContainer } from "./ui";
import { ProcessedChartData, hasValidData } from "../utils";

interface ActivityChartsProps {
  chartData: ProcessedChartData;
}

const ActivityCharts = ({ chartData }: ActivityChartsProps) => {
  const { labels, speedData, hrData, altitudeData, powerData } = chartData;

  return (
    <>
      {hasValidData(speedData) && (
        <SectionContainer spacing="compact">
          <LineChart
            labels={labels}
            data={speedData}
            title="Speed"
            xAxisLabel="Distance (km)"
            yAxisLabel="Speed (km/h)"
          />
        </SectionContainer>
      )}

      {hasValidData(hrData) && (
        <SectionContainer spacing="compact">
          <LineChart
            labels={labels}
            data={hrData}
            title="Heart Rate"
            xAxisLabel="Distance (km)"
            yAxisLabel="Heart Rate (bpm)"
          />
        </SectionContainer>
      )}

      {hasValidData(altitudeData) && (
        <SectionContainer spacing="compact">
          <LineChart
            labels={labels}
            data={altitudeData}
            title="Altitude"
            xAxisLabel="Distance (km)"
            yAxisLabel="Altitude (m)"
          />
        </SectionContainer>
      )}

      {hasValidData(powerData) && (
        <SectionContainer spacing="compact">
          <LineChart labels={labels} data={powerData} title="Power" xAxisLabel="Distance (km)" yAxisLabel="Power (W)" />
        </SectionContainer>
      )}
    </>
  );
};

export default ActivityCharts;
