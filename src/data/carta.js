// ── CARTA de Casa Tere ────────────────────────────────────────────────────
// Transcrita de la carta física (precios con IGIC incluido). Cada texto
// visible es un objeto { es, en, de, fr, it }; si falta un idioma se muestra
// el español. Campos de cada plato:
//   nombre · desc (opcional) · precio (ración) · media (media ración, opcional)
//   alergenos: números del 1 al 14 (la lista está en i18n, carta.alergenosLista)
//   sol: true (opcional) marca lo que recomienda la casa: sale con el sol del logo.
// El precio es texto libre ("13,00 €") o un objeto traducido ("Según mercado").
// Nacho lo edita todo desde la web; esto solo se usa si Supabase no responde.

const MERCADO = { es: 'Según mercado', en: 'Market price', de: 'Tagespreis', fr: 'Prix du marché', it: 'Prezzo di mercato' }

export const carta = [
  {
    id: 'ensaladas',
    titulo: { es: 'Ensaladas', en: 'Salads', de: 'Salate', fr: 'Salades', it: 'Insalate' },
    platos: [
      {
        nombre: { es: 'Ensalada de la casa', en: 'House salad', de: 'Salat des Hauses', fr: 'Salade maison', it: 'Insalata della casa' },
        precio: '13,00 €', media: '9,00 €', alergenos: [4, 7, 12],
      },
      {
        nombre: { es: 'Ensalada de canónigos', en: "Lamb's lettuce salad", de: 'Feldsalat', fr: 'Salade de mâche', it: 'Insalata di valeriana' },
        precio: '13,00 €', media: '9,00 €', alergenos: [1, 5, 7, 10, 12, 14],
      },
      {
        nombre: { es: 'Ensalada de cogollos', en: 'Lettuce hearts salad', de: 'Salatherzen', fr: 'Salade de cœurs de laitue', it: 'Insalata di cuori di lattuga' },
        precio: '13,00 €', alergenos: [4, 7, 12],
      },
      {
        nombre: { es: 'Ensalada de pimientos asados', en: 'Roasted pepper salad', de: 'Salat mit gerösteter Paprika', fr: 'Salade de poivrons grillés', it: 'Insalata di peperoni arrostiti' },
        precio: '10,50 €', alergenos: [4, 12],
      },
      {
        nombre: { es: 'Ensaladilla rusa', en: 'Russian salad (Spanish potato salad)', de: 'Russischer Salat', fr: 'Salade russe', it: 'Insalata russa' },
        precio: '9,50 €', alergenos: [1, 3, 4, 6, 10, 12],
      },
      {
        nombre: { es: 'Ensalada de ibéricos', en: 'Iberian ham salad', de: 'Salat mit iberischem Schinken', fr: 'Salade aux ibériques', it: 'Insalata di salumi iberici' },
        desc: {
          es: 'Ensalada fresca con jamón ibérico, aguacate y tomate.',
          en: 'Fresh salad with Iberian cured ham, avocado and tomato.',
          de: 'Frischer Salat mit iberischem Schinken, Avocado und Tomate.',
          fr: 'Salade fraîche au jambon ibérique, avocat et tomate.',
          it: 'Insalata fresca con prosciutto iberico, avocado e pomodoro.',
        },
        precio: '13,00 €',
      },
    ],
  },
  {
    id: 'entrantes',
    titulo: { es: 'Entrantes', en: 'Starters', de: 'Vorspeisen', fr: 'Entrées', it: 'Antipasti' },
    platos: [
      {
        nombre: { es: 'Pan con ajo', en: 'Garlic bread', de: 'Knoblauchbrot', fr: "Pain à l'ail", it: "Pane all'aglio" },
        precio: '2,50 €', alergenos: [1, 7, 12],
      },
      {
        nombre: { es: 'Papas arrugadas', en: 'Papas arrugadas (Canarian wrinkled potatoes)', de: 'Papas arrugadas (kanarische Runzelkartoffeln)', fr: 'Papas arrugadas (pommes de terre ridées canariennes)', it: 'Papas arrugadas (patate rugose canarie)' },
        precio: '5,50 €', alergenos: [1],
      },
      {
        nombre: { es: 'Papas bravas', en: 'Papas bravas (potatoes with spicy sauce)', de: 'Papas bravas (Kartoffeln mit pikanter Soße)', fr: 'Papas bravas (pommes de terre sauce piquante)', it: 'Papas bravas (patate con salsa piccante)' },
        precio: '5,50 €',
      },
      {
        nombre: { es: 'Pimientos de Padrón', en: 'Padrón peppers', de: 'Padrón-Paprika', fr: 'Poivrons de Padrón', it: 'Peperoni di Padrón' },
        precio: '8,50 €',
      },
      {
        nombre: { es: 'Verduras a la plancha', en: 'Grilled vegetables', de: 'Gegrilltes Gemüse', fr: 'Légumes à la plancha', it: 'Verdure alla piastra' },
        precio: '11,50 €',
      },
      {
        nombre: { es: 'Cazuela de la casa', en: 'House casserole', de: 'Schmortopf des Hauses', fr: 'Cassolette maison', it: 'Casseruola della casa' },
        precio: '15,00 €', alergenos: [4, 14],
      },
      {
        nombre: { es: 'Setas a la plancha', en: 'Grilled wild mushrooms', de: 'Gegrillte Pilze', fr: 'Champignons des bois à la plancha', it: 'Funghi alla piastra' },
        precio: '9,50 €', alergenos: [12],
      },
      {
        nombre: { es: 'Salpicón de pulpo', en: 'Octopus salad', de: 'Oktopussalat', fr: 'Salpicon de poulpe', it: 'Insalata di polpo' },
        precio: '15,00 €', alergenos: [14],
      },
      {
        nombre: { es: 'Berenjenas', en: 'Aubergines', de: 'Auberginen', fr: 'Aubergines', it: 'Melanzane' },
        precio: '9,50 €', media: '7,00 €', alergenos: [1, 3],
      },
      {
        nombre: { es: 'Calabacín a la plancha', en: 'Grilled courgette', de: 'Gegrillte Zucchini', fr: 'Courgette à la plancha', it: 'Zucchine alla piastra' },
        precio: '8,50 €', media: '6,00 €',
      },
      {
        nombre: { es: 'Croquetas mixtas', en: 'Mixed croquettes', de: 'Gemischte Kroketten', fr: 'Croquettes variées', it: 'Crocchette miste' },
        precio: '9,50 €', media: '6,00 €', alergenos: [1, 3, 4, 7, 12],
      },
      {
        nombre: { es: 'Champiñones al ajillo', en: 'Mushrooms in garlic', de: 'Champignons in Knoblauchöl', fr: "Champignons à l'ail", it: "Champignon all'aglio" },
        precio: '9,50 €',
      },
      {
        nombre: { es: 'Queso frito', en: 'Fried cheese', de: 'Gebratener Käse', fr: 'Fromage frit', it: 'Formaggio fritto' },
        precio: '10,50 €', media: '7,00 €', alergenos: [1, 3, 7, 12],
      },
      {
        nombre: { es: 'Queso de rulo de cabra', en: "Goat's cheese log", de: 'Ziegenkäserolle', fr: 'Bûche de chèvre', it: 'Rotolo di formaggio di capra' },
        precio: '10,50 €', media: '6,00 €', alergenos: [1, 7, 12],
      },
      {
        nombre: { es: 'Revuelto de gambas y setas', en: 'Scrambled eggs with prawns and wild mushrooms', de: 'Rührei mit Garnelen und Pilzen', fr: 'Œufs brouillés aux crevettes et champignons des bois', it: 'Uova strapazzate con gamberi e funghi' },
        precio: '9,50 €', alergenos: [2, 3],
      },
      {
        nombre: { es: 'Revuelto de gambas y espárragos', en: 'Scrambled eggs with prawns and asparagus', de: 'Rührei mit Garnelen und Spargel', fr: 'Œufs brouillés aux crevettes et asperges', it: 'Uova strapazzate con gamberi e asparagi' },
        precio: '9,50 €', alergenos: [2, 3, 12],
      },
      {
        nombre: { es: 'Revuelto de gambas y champiñones', en: 'Scrambled eggs with prawns and mushrooms', de: 'Rührei mit Garnelen und Champignons', fr: 'Œufs brouillés aux crevettes et champignons', it: 'Uova strapazzate con gamberi e champignon' },
        precio: '9,50 €', alergenos: [2, 3],
      },
      {
        nombre: { es: 'Revuelto de salmón y puerros', en: 'Scrambled eggs with salmon and leeks', de: 'Rührei mit Lachs und Lauch', fr: 'Œufs brouillés au saumon et aux poireaux', it: 'Uova strapazzate con salmone e porri' },
        precio: '10,50 €', alergenos: [3, 4],
      },
      {
        nombre: { es: 'Revuelto de calabacín y jamón', en: 'Scrambled eggs with courgette and ham', de: 'Rührei mit Zucchini und Schinken', fr: 'Œufs brouillés aux courgettes et au jambon', it: 'Uova strapazzate con zucchine e prosciutto' },
        precio: '9,50 €', alergenos: [3, 12],
      },
      {
        nombre: { es: 'Servicio de pan y mantequilla', en: 'Bread and butter', de: 'Brot und Butter', fr: 'Pain et beurre', it: 'Pane e burro' },
        precio: '1,50 €', alergenos: [1, 7, 12],
      },
    ],
  },
  {
    id: 'pescados',
    titulo: { es: 'Pescados y mariscos', en: 'Fish and seafood', de: 'Fisch und Meeresfrüchte', fr: 'Poissons et fruits de mer', it: 'Pesce e frutti di mare' },
    platos: [
      {
        nombre: { es: 'Pulpo a la gallega', en: 'Galician-style octopus', de: 'Oktopus nach galicischer Art', fr: 'Poulpe à la galicienne', it: 'Polpo alla galiziana' },
        precio: '18,00 €', alergenos: [14],
      },
      {
        nombre: { es: 'Cazón', en: 'Dogfish (cazón)', de: 'Hundshai (Cazón)', fr: 'Roussette (cazón)', it: 'Palombo (cazón)' },
        precio: '10,50 €', alergenos: [1, 4, 6, 12],
      },
      {
        nombre: { es: 'Calamares saharianos fritos', en: 'Fried Saharan squid', de: 'Frittierter Sahara-Tintenfisch', fr: 'Calamars du Sahara frits', it: 'Calamari sahariani fritti' },
        precio: '18,00 €', media: '10,50 €', alergenos: [1, 14],
      },
      {
        nombre: { es: 'Calamares saharianos a la plancha', en: 'Grilled Saharan squid', de: 'Gegrillter Sahara-Tintenfisch', fr: 'Calamars du Sahara à la plancha', it: 'Calamari sahariani alla piastra' },
        precio: '19,00 €', alergenos: [14],
      },
      {
        nombre: { es: 'Puntillas', en: 'Puntillas (fried baby squid)', de: 'Puntillas (frittierte Babytintenfische)', fr: 'Puntillas (petits calamars frits)', it: 'Puntillas (calamaretti fritti)' },
        precio: '10,50 €', media: '7,50 €', alergenos: [1, 14],
      },
      {
        nombre: { es: 'Chipirones', en: 'Chipirones (small squid)', de: 'Chipirones (kleine Tintenfische)', fr: 'Chipirons (petits calamars)', it: 'Chipirones (piccoli calamari)' },
        precio: '11,50 €', alergenos: [1, 14],
      },
      {
        nombre: { es: 'Langostinos al ajillo', en: 'King prawns in garlic', de: 'Riesengarnelen in Knoblauchöl', fr: "Gambas à l'ail", it: "Gamberoni all'aglio" },
        precio: '12,50 €', alergenos: [2],
      },
      {
        nombre: { es: 'Gamba blanca a la plancha', en: 'Grilled white prawns', de: 'Gegrillte weiße Garnelen', fr: 'Crevettes blanches à la plancha', it: 'Gamberi bianchi alla piastra' },
        precio: '23,00 €', alergenos: [2],
      },
      {
        nombre: { es: 'Mejillones al vapor', en: 'Steamed mussels', de: 'Gedämpfte Miesmuscheln', fr: 'Moules à la vapeur', it: 'Cozze al vapore' },
        precio: '13,00 €', alergenos: [14],
      },
      {
        nombre: { es: 'Boquerones en vinagre', en: 'Anchovies in vinegar', de: 'Sardellen in Essig', fr: 'Anchois au vinaigre', it: 'Alici marinate' },
        precio: '11,50 €', alergenos: [4, 12],
      },
      {
        nombre: { es: 'Boquerones fritos', en: 'Fried anchovies', de: 'Frittierte Sardellen', fr: 'Anchois frits', it: 'Alici fritte' },
        precio: '13,50 €', media: '9,50 €', alergenos: [1, 4],
      },
      {
        nombre: { es: 'Sardinas', en: 'Sardines', de: 'Sardinen', fr: 'Sardines', it: 'Sardine' },
        precio: '13,50 €', alergenos: [4],
      },
      {
        nombre: { es: 'Bacalao frito', en: 'Fried cod', de: 'Gebackener Kabeljau', fr: 'Morue frite', it: 'Baccalà fritto' },
        precio: '16,00 €', media: '11,50 €', alergenos: [1, 3, 4],
      },
      {
        nombre: { es: 'Fritura de pescado', en: 'Mixed fried fish', de: 'Gemischte Fischfritüre', fr: 'Friture de poisson', it: 'Frittura di pesce' },
        precio: '33,00 €', media: '21,00 €', alergenos: [1, 3, 4],
      },
      {
        nombre: { es: 'Pescado del día', en: 'Fish of the day', de: 'Fisch des Tages', fr: 'Poisson du jour', it: 'Pesce del giorno' },
        precio: MERCADO,
      },
    ],
  },
  {
    id: 'carnes',
    titulo: { es: 'Carnes', en: 'Meat', de: 'Fleisch', fr: 'Viandes', it: 'Carni' },
    platos: [
      {
        nombre: { es: 'Solomillo al grill', en: 'Grilled sirloin steak', de: 'Gegrilltes Rinderfilet', fr: 'Filet de bœuf grillé', it: 'Filetto alla griglia' },
        precio: '24,00 €',
      },
      {
        nombre: { es: 'Filet mignon', en: 'Filet mignon', de: 'Filet Mignon', fr: 'Filet mignon', it: 'Filet mignon' },
        precio: '24,00 €',
      },
      {
        nombre: { es: 'Vueltas de solomillo', en: 'Sirloin medallions', de: 'Filetmedaillons', fr: 'Médaillons de filet', it: 'Medaglioni di filetto' },
        precio: '18,00 €',
      },
      {
        nombre: { es: 'Secreto ibérico', en: 'Secreto (Iberian pork)', de: 'Secreto (iberisches Schwein)', fr: 'Secreto ibérique', it: 'Secreto iberico' },
        precio: '20,00 €',
      },
      {
        nombre: { es: 'Presa ibérica', en: 'Presa (Iberian pork shoulder)', de: 'Presa (iberische Schweineschulter)', fr: 'Presa ibérique', it: 'Presa iberica' },
        precio: '22,00 €',
      },
      {
        nombre: { es: 'Chuletón', en: 'Chuletón (bone-in rib steak)', de: 'Chuletón (großes Rindersteak am Knochen)', fr: 'Côte de bœuf', it: 'Costata' },
        precio: MERCADO,
      },
      {
        nombre: { es: 'Cabrito', en: 'Kid goat', de: 'Zicklein', fr: 'Chevreau', it: 'Capretto' },
        precio: '20,00 €', alergenos: [12],
      },
      {
        nombre: { es: 'Conejo', en: 'Rabbit', de: 'Kaninchen', fr: 'Lapin', it: 'Coniglio' },
        precio: '14,00 €', alergenos: [12],
      },
      {
        nombre: { es: 'Carne de cochino frita', en: 'Canarian fried pork', de: 'Gebratenes Schweinefleisch nach kanarischer Art', fr: 'Porc frit à la canarienne', it: 'Maiale fritto alla canaria' },
        precio: '14,00 €', media: '8,50 €', alergenos: [12],
      },
      {
        nombre: { es: 'Brocheta de cerdo', en: 'Pork skewer', de: 'Schweinefleischspieß', fr: 'Brochette de porc', it: 'Spiedino di maiale' },
        precio: '10,50 €', alergenos: [12],
      },
      {
        nombre: { es: 'Albóndigas', en: 'Meatballs', de: 'Fleischbällchen', fr: 'Boulettes de viande', it: 'Polpette' },
        precio: '12,00 €', media: '8,50 €', alergenos: [1, 3],
      },
      {
        nombre: { es: 'Papas a lo pobre', en: 'Papas a lo pobre', de: 'Papas a lo pobre', fr: 'Papas a lo pobre', it: 'Papas a lo pobre' },
        desc: {
          es: 'Papas, pimiento, cebolla, morcilla, chorizo y huevo.',
          en: 'Potatoes, peppers, onion, black pudding, chorizo and egg.',
          de: 'Kartoffeln, Paprika, Zwiebeln, Blutwurst, Chorizo und Ei.',
          fr: 'Pommes de terre, poivrons, oignon, boudin, chorizo et œuf.',
          it: 'Patate, peperoni, cipolla, sanguinaccio, chorizo e uovo.',
        },
        precio: '14,00 €', media: '9,50 €', alergenos: [1, 6, 12],
      },
      {
        nombre: { es: 'Huevos rotos', en: 'Huevos rotos (broken eggs)', de: 'Huevos rotos (Spiegeleier auf Kartoffeln)', fr: 'Huevos rotos (œufs cassés)', it: 'Huevos rotos (uova rotte)' },
        desc: {
          es: 'Papas, cebolla, huevo, chorizo y jamón.',
          en: 'Potatoes, onion, egg, chorizo and ham.',
          de: 'Kartoffeln, Zwiebeln, Ei, Chorizo und Schinken.',
          fr: 'Pommes de terre, oignon, œuf, chorizo et jambon.',
          it: 'Patate, cipolla, uovo, chorizo e prosciutto.',
        },
        precio: '14,00 €', media: '9,50 €', alergenos: [1, 3, 6, 7, 12],
      },
    ],
  },
  {
    id: 'postres',
    titulo: { es: 'Postres', en: 'Desserts', de: 'Nachspeisen', fr: 'Desserts', it: 'Dolci' },
    platos: [
      {
        nombre: { es: 'Flan', en: 'Flan (crème caramel)', de: 'Flan (Karamellpudding)', fr: 'Flan', it: 'Flan' },
        precio: '6,50 €', alergenos: [3, 7],
      },
      {
        nombre: { es: 'Arroz con leche', en: 'Rice pudding', de: 'Milchreis', fr: 'Riz au lait', it: 'Riso al latte' },
        precio: '6,50 €', alergenos: [7],
      },
      {
        nombre: { es: 'Torrijas', en: 'Torrijas (Spanish French toast)', de: 'Torrijas (Arme Ritter)', fr: 'Torrijas (pain perdu)', it: 'Torrijas (pane dolce fritto)' },
        precio: '6,50 €', alergenos: [1, 3, 7],
      },
      {
        nombre: { es: 'Tiramisú', en: 'Tiramisu', de: 'Tiramisu', fr: 'Tiramisu', it: 'Tiramisù' },
        precio: '6,50 €', alergenos: [1, 3, 6, 7, 12],
      },
      {
        nombre: { es: 'Tarta de queso', en: 'Cheesecake', de: 'Käsekuchen', fr: 'Cheesecake', it: 'Cheesecake' },
        precio: '6,50 €', alergenos: [1, 7, 11, 12],
      },
      {
        nombre: { es: 'Tarta de Santiago', en: 'Tarta de Santiago (almond cake)', de: 'Tarta de Santiago (Mandelkuchen)', fr: 'Tarte de Santiago (aux amandes)', it: 'Torta di Santiago (alle mandorle)' },
        precio: '6,50 €', alergenos: [1, 3, 7, 12],
      },
      {
        nombre: { es: 'Tarta de chocolate', en: 'Chocolate cake', de: 'Schokoladenkuchen', fr: 'Gâteau au chocolat', it: 'Torta al cioccolato' },
        precio: '6,50 €', alergenos: [1, 3, 7, 12],
      },
      {
        nombre: { es: 'Brownie con helado', en: 'Brownie with ice cream', de: 'Brownie mit Eis', fr: 'Brownie et sa glace', it: 'Brownie con gelato' },
        precio: '6,50 €', alergenos: [1, 3, 6, 7, 8, 12],
      },
      {
        nombre: { es: 'Coulant con helado', en: 'Chocolate coulant with ice cream', de: 'Schokoladen-Coulant mit Eis', fr: 'Coulant au chocolat et sa glace', it: 'Coulant al cioccolato con gelato' },
        precio: '6,50 €', alergenos: [1, 3, 6, 7, 12],
      },
      {
        nombre: { es: 'Copa de helado variado', en: 'Assorted ice cream cup', de: 'Gemischter Eisbecher', fr: 'Coupe de glaces variées', it: 'Coppa di gelato misto' },
        precio: '6,50 €', alergenos: [7],
      },
      {
        nombre: { es: 'Polvito uruguayo', en: 'Polvito uruguayo (meringue and dulce de leche)', de: 'Polvito uruguayo (Baiser und Dulce de Leche)', fr: 'Polvito uruguayo (meringue et dulce de leche)', it: 'Polvito uruguayo (meringa e dulce de leche)' },
        precio: '6,50 €', alergenos: [3, 7],
      },
      {
        nombre: { es: 'Mousse de chocolate', en: 'Chocolate mousse', de: 'Schokoladenmousse', fr: 'Mousse au chocolat', it: 'Mousse al cioccolato' },
        precio: '6,50 €', alergenos: [3, 7],
      },
      {
        nombre: { es: 'Mousse de gofio', en: 'Gofio mousse', de: 'Gofio-Mousse', fr: 'Mousse de gofio', it: 'Mousse di gofio' },
        precio: '6,50 €', alergenos: [1, 3, 7],
      },
    ],
  },
]

// Bodega: misma estructura. Vacía hasta que Nacho la rellene (la pestaña
// solo aparece al público cuando hay vinos).
export const vinosBase = []
