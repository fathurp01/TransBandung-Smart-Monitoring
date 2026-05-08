const DAYS = ["Min","Sen","Sel","Rab","Kam","Jum","Sab"];

function Skeleton() {
  const s = { background: "var(--border)", borderRadius: 4, display: "block" };
  return (
    <div className="route-card" style={{ opacity: 0.5 }}>
      <div className="route-top">
        <span style={{ ...s, width: 52, height: 18 }} />
        <span style={{ ...s, width: 44, height: 18 }} />
      </div>
      <div style={{ ...s, width: "65%", height: 16, marginBottom: 6 }} />
      <div style={{ ...s, width: "42%", height: 13, marginBottom: 16 }} />
      {[1,2].map(i => <div key={i} style={{ ...s, height: 31, marginBottom: 5 }} />)}
    </div>
  );
}

export default function TransportMonitor({ routes, ready }) {
  return (
    <section>
      <div className="section-head">
        <div className="section-tag">Fitur 1 — Monitoring</div>
        <div className="section-title">Rute &amp; Jadwal Transportasi</div>
        <p className="section-desc">
          Informasi rute transportasi publik aktif di Kota Bandung beserta jadwal keberangkatan dan kedatangan.
        </p>
      </div>

      {!ready ? (
        <div className="grid-3">
          {[1,2,3].map(i => <Skeleton key={i} />)}
        </div>
      ) : routes.length === 0 ? (
        <div className="empty">
          <div className="empty-title">Belum ada data rute</div>
          <div className="empty-sub">Data akan tampil setelah backend terhubung ke RDS.</div>
        </div>
      ) : (
        <div className="grid-3">
          {routes.map(route => (
            <div className="route-card" key={route.id} id={`route-${route.id}`}>
              <div className="route-top">
                <span className="route-code">{route.route_code}</span>
                <span className="route-active">Aktif</span>
              </div>
              <div className="route-name">{route.route_name}</div>
              <div className="route-op">{route.operator}</div>

              {route.schedules?.length > 0 ? (
                <div className="sched-list">
                  {route.schedules.map(s => (
                    <div className="sched-row" key={s.id}>
                      <span className="sched-day">{DAYS[s.day_of_week] ?? s.day_of_week}</span>
                      <span className="sched-dep">{s.departure_time}</span>
                      <span className="sched-sep">›</span>
                      <span className="sched-arr">{s.arrival_time}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: "0.78rem", color: "var(--text-3)" }}>Belum ada jadwal.</p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
