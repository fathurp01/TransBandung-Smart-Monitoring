const DAY_NAMES = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

function SkeletonCard() {
  return (
    <div className="route-card" style={{ opacity: 0.5 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ width: 60, height: 20, background: "rgba(255,255,255,0.06)", borderRadius: 100 }} />
        <div style={{ width: 8, height: 8, background: "rgba(255,255,255,0.06)", borderRadius: "50%", marginTop: 6 }} />
      </div>
      <div style={{ width: "70%", height: 18, background: "rgba(255,255,255,0.06)", borderRadius: 6, marginBottom: 8 }} />
      <div style={{ width: "50%", height: 14, background: "rgba(255,255,255,0.04)", borderRadius: 6, marginBottom: 16 }} />
      {[1, 2].map((i) => (
        <div key={i} style={{ height: 36, background: "rgba(255,255,255,0.03)", borderRadius: 8, marginBottom: 6 }} />
      ))}
    </div>
  );
}

export default function TransportMonitor({ routes, loading }) {
  return (
    <section className="section">
      <div className="section-header">
        <div className="section-eyebrow">🗺️ Fitur 1</div>
        <h2>Monitoring Rute & <span>Jadwal</span></h2>
        <p className="section-desc">
          Informasi rute transportasi publik aktif di Kota Bandung beserta jadwal keberangkatan dan kedatangan.
        </p>
      </div>

      {loading ? (
        <div className="grid-3">
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : routes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🚌</div>
          <p style={{ fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>Belum ada data rute tersedia</p>
          <p>Data rute akan muncul setelah backend terhubung ke database RDS.</p>
        </div>
      ) : (
        <div className="grid-3">
          {routes.map((route) => (
            <div className="route-card" key={route.id} id={`route-${route.id}`}>
              <div className="route-header">
                <span className="route-code">{route.route_code}</span>
                <div className="route-status-dot" title="Aktif" />
              </div>
              <div className="route-name">{route.route_name}</div>
              <div className="route-operator">🏢 {route.operator}</div>

              {route.schedules?.length > 0 ? (
                <div className="schedule-list">
                  {route.schedules.map((s) => (
                    <div className="schedule-item" key={s.id}>
                      <span className="schedule-day">{DAY_NAMES[s.day_of_week] ?? s.day_of_week}</span>
                      <span className="schedule-time">{s.departure_time}</span>
                      <span className="schedule-arrow">→</span>
                      <span className="schedule-arrive">{s.arrival_time}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: 8 }}>
                  Belum ada jadwal tersedia.
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
