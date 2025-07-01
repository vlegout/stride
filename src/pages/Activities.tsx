import ActivitiesPageView from "../components/ActivitiesPageView";
import { useActivitiesStore } from "../store";

const ActivitiesPage = () => {
  const { sport, distance, race, setSport, setDistance, setRace } = useActivitiesStore();

  return (
    <ActivitiesPageView
      sport={sport}
      distance={distance}
      race={race}
      onSportChange={setSport}
      onDistanceChange={setDistance}
      onRaceChange={setRace}
    />
  );
};

export default ActivitiesPage;
