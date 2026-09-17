INSERT INTO categories (name, slug) VALUES
('Portails & clôtures','portails-clotures'),
('Portes métalliques','portes-metalliques'),
('Fenêtres & protections','fenetres-protections'),
('Mobilier métallique','mobilier-metallique'),
('Porte-rideaux','porte-rideaux')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO services (title, slug, description, icon, sort_order) VALUES
('Portails & clôtures','portails-clotures','Portails battants ou coulissants, grilles et clôtures sur mesure.','POR',1),
('Portes métalliques','portes-metalliques','Portes de sécurité et portes décoratives sur mesure.','POR',2),
('Fenêtres & protections','fenetres-protections','Fenêtres métalliques et protections adaptées à votre habitation.','FEN',3),
('Salle à manger','salle-a-manger','Tables et chaises métalliques réalisées selon vos dimensions.','MOB',4),
('Porte-rideaux','porte-rideaux','Rideaux métalliques pour commerces et locaux.','RDM',5),
('Fabrication sur mesure','fabrication-sur-mesure','Étude et fabrication à partir d’un croquis, modèle ou besoin.','SUR',6)
ON CONFLICT (slug) DO NOTHING;
