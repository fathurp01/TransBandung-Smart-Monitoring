export default function TransportMonitor({ routes }) {
  return (
    <section>
      <h2>Monitoring Transportasi</h2>
      <div className="list">
        {routes.length === 0 && <p>Belum ada data rute.</p>}
        {routes.map((route) => (
          <div className="card" key={route.id}>
            <strong>{route.route_code} - {route.route_name}</strong>
            <div>Operator: {route.operator}</div>
            <div>Jadwal:</div>
            <ul>
              {route.schedules?.map((schedule) => (
                <li key={schedule.id}>
                  Hari {schedule.day_of_week}: {schedule.departure_time} - {schedule.arrival_time}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
