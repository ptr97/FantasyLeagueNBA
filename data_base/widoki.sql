-- Widoki

-- widok laczacy uzytkownikow z ich zespolami
CREATE VIEW nba.widok_uzytkownik_zespol AS 
    SELECT uzyt.id_uzytkownika, 
        uzyt.email_uzytkownika, 
        zes.id_zespolu_uzytkownika, 
        zes.nazwa_zespolu_uzytkownika, 
        zes.wynik_zespolu_uzytkownika, 
        (SELECT SUM(wartosc_kontraktu) FROM nba.zawodnicy_zespoly_uzytkownikow WHERE id_zespolu_uzytkownika = zes.id_zespolu_uzytkownika) as suma_wynagrodzen_zawodnikow,
        zes.budzet_zespolu_uzytkownika 
    FROM nba.uzytkownicy uzyt 
    NATURAL JOIN nba.zespoly_uzytkownikow zes;

-- widok laczacy zespoly uzytkownikow z zawodnikami
CREATE VIEW nba.widok_zespol_uzyt_zawodnicy AS 
    SELECT zes.id_zespolu_uzytkownika, 
        zes.nazwa_zespolu_uzytkownika, 
        zzu.id_zawodnika,
        zzu.wartosc_kontraktu, 
        zaw.nazwisko_zawodnika, 
        zaw.imie_zawodnika, 
        zaw.pozycja_zawodnika, 
        zaw.zarobki_zawodnika 
    FROM nba.zespoly_uzytkownikow zes 
    NATURAL JOIN nba.zawodnicy_zespoly_uzytkownikow zzu 
    NATURAL JOIN nba.zawodnicy zaw;

-- widok laczacy uzytkownikow z zawodnikami w ich zespolach
CREATE VIEW nba.widok_uzyt_zawodnicy AS 
    SELECT wuz.id_uzytkownika, 
        wuz.email_uzytkownika, 
        wuz.id_zespolu_uzytkownika, 
        wuz.nazwa_zespolu_uzytkownika, 
        wuz.wynik_zespolu_uzytkownika, 
        wuz.suma_wynagrodzen_zawodnikow, 
        zzu.id_zawodnika, 
        zzu.imie_zawodnika, 
        zzu.nazwisko_zawodnika, 
        zzu.pozycja_zawodnika, 
        zzu.zarobki_zawodnika,
        zzu.wartosc_kontraktu 
    FROM nba.widok_uzytkownik_zespol wuz 
    JOIN nba.widok_zespol_uzyt_zawodnicy zzu 
    USING (id_zespolu_uzytkownika);

-- widok zawodnikow ktorzy moga byc obroncami ('G' - guard)
CREATE VIEW nba.obroncy AS 
    SELECT * FROM nba.zawodnicy 
    WHERE nba.czyObronca(id_zawodnika) = TRUE;

-- widok zawodnikow ktorzy moga byc skrzydlowymi ('F' - forward)
CREATE VIEW nba.skrzydlowi AS 
    SELECT * FROM nba.zawodnicy 
    WHERE nba.czySkrzydlowy(id_zawodnika) = TRUE;

-- widok zawodnikow ktorzy moga byc centrami ('C' - center)
CREATE VIEW nba.centrzy AS 
    SELECT * FROM nba.zawodnicy 
    WHERE nba.czyCenter(id_zawodnika) = TRUE;

-- widok laczacy oficjalne zespoly nba z ich wynikami - bilansem meczow wygranych i przegranych
CREATE VIEW nba.widok_zespoly_bilans AS 
    SELECT oz.id_oficjalnego_zespolu,
        oz.nazwa_oficjalnego_zespolu,
        oz.kod_oficjalnego_zespolu,
        oz.dywizja_oficjalnego_zespolu,
        oz.konferencja_oficjalnego_zespolu,
        (SELECT COUNT(*) FROM nba.mecze 
            WHERE (id_zespolu_gospodarzy = oz.id_oficjalnego_zespolu AND punkty_zespolu_gospodarzy > punkty_zespolu_gosci)
            OR (id_zespolu_gosci = oz.id_oficjalnego_zespolu AND punkty_zespolu_gosci > punkty_zespolu_gospodarzy)
        ) AS zwyciestwa,
        (SELECT COUNT(*) FROM nba.mecze 
            WHERE (id_zespolu_gospodarzy = oz.id_oficjalnego_zespolu AND punkty_zespolu_gospodarzy < punkty_zespolu_gosci)
            OR (id_zespolu_gosci = oz.id_oficjalnego_zespolu AND punkty_zespolu_gosci < punkty_zespolu_gospodarzy)
        ) AS porazki
    FROM nba.oficjalne_zespoly oz;    

-- widok laczacy zawodnikow wraz z ich statystykami wyrazonymi jako srednie na mecz
CREATE VIEW nba.widok_statystyki_zawodnikow AS
    SELECT z.id_zawodnika,
        z.nazwisko_zawodnika,
        z.imie_zawodnika,
        z.pozycja_zawodnika,
        z.numer_koszulki,
        z.zarobki_zawodnika,
        z.waga_zawodnika,
        z.wzrost_zawodnika,
        ROUND(
        ((SELECT SUM(punkty_zawodnika)::float 
            FROM nba.statystyki_meczu 
            WHERE id_zawodnika = z.id_zawodnika
        )/(SELECT COUNT(*)
            FROM nba.statystyki_meczu 
            WHERE id_zawodnika = z.id_zawodnika
        ))::numeric, 2) AS PPG,
        ROUND(
        ((SELECT SUM(asysty_zawodnika)::float 
            FROM nba.statystyki_meczu 
            WHERE id_zawodnika = z.id_zawodnika
        )/(SELECT COUNT(*)
            FROM nba.statystyki_meczu 
            WHERE id_zawodnika = z.id_zawodnika
        ))::numeric, 2) AS APG,
        ROUND(
        ((SELECT SUM(zbiorki_zawodnika)::float 
            FROM nba.statystyki_meczu 
            WHERE id_zawodnika = z.id_zawodnika
        )/(SELECT COUNT(*)
            FROM nba.statystyki_meczu 
            WHERE id_zawodnika = z.id_zawodnika
        ))::numeric, 2) AS RPG,
        ROUND(
        ((SELECT SUM(przechwyty_zawodnika)::float 
            FROM nba.statystyki_meczu 
            WHERE id_zawodnika = z.id_zawodnika
        )/(SELECT COUNT(*)
            FROM nba.statystyki_meczu 
            WHERE id_zawodnika = z.id_zawodnika
        ))::numeric, 2) AS SPG,
        ROUND(
        ((SELECT SUM(straty_zawodnika)::float 
            FROM nba.statystyki_meczu 
            WHERE id_zawodnika = z.id_zawodnika
        )/(SELECT COUNT(*)
            FROM nba.statystyki_meczu 
            WHERE id_zawodnika = z.id_zawodnika
        ))::numeric, 2) AS TPG
    FROM nba.zawodnicy z
    WHERE (
        SELECT COUNT(*) FROM nba.statystyki_meczu WHERE id_zawodnika = z.id_zawodnika) > 0
    ORDER BY PPG DESC;


-- widok laczacy zawodnikow ktorzy moge byc obroncami wraz z ich statystykami wyrazonymi jako srednie na mecz
CREATE VIEW nba.widok_statystyki_obroncow AS
    SELECT z.id_zawodnika,
        z.nazwisko_zawodnika,
        z.imie_zawodnika,
        z.pozycja_zawodnika,
        z.numer_koszulki,
        z.zarobki_zawodnika,
        ROUND(
        ((SELECT SUM(punkty_zawodnika)::float 
            FROM nba.statystyki_meczu 
            WHERE id_zawodnika = z.id_zawodnika
        )/(SELECT COUNT(*)
            FROM nba.statystyki_meczu 
            WHERE id_zawodnika = z.id_zawodnika
        ))::numeric, 2) AS PPG,
        ROUND(
        ((SELECT SUM(asysty_zawodnika)::float 
            FROM nba.statystyki_meczu 
            WHERE id_zawodnika = z.id_zawodnika
        )/(SELECT COUNT(*)
            FROM nba.statystyki_meczu 
            WHERE id_zawodnika = z.id_zawodnika
        ))::numeric, 2) AS APG,
        ROUND(
        ((SELECT SUM(zbiorki_zawodnika)::float 
            FROM nba.statystyki_meczu 
            WHERE id_zawodnika = z.id_zawodnika
        )/(SELECT COUNT(*)
            FROM nba.statystyki_meczu 
            WHERE id_zawodnika = z.id_zawodnika
        ))::numeric, 2) AS RPG,
        ROUND(
        ((SELECT SUM(przechwyty_zawodnika)::float 
            FROM nba.statystyki_meczu 
            WHERE id_zawodnika = z.id_zawodnika
        )/(SELECT COUNT(*)
            FROM nba.statystyki_meczu 
            WHERE id_zawodnika = z.id_zawodnika
        ))::numeric, 2) AS SPG,
        ROUND(
        ((SELECT SUM(straty_zawodnika)::float 
            FROM nba.statystyki_meczu 
            WHERE id_zawodnika = z.id_zawodnika
        )/(SELECT COUNT(*)
            FROM nba.statystyki_meczu 
            WHERE id_zawodnika = z.id_zawodnika
        ))::numeric, 2) AS TPG
    FROM nba.zawodnicy z
    WHERE (
        SELECT COUNT(*) FROM nba.statystyki_meczu WHERE id_zawodnika = z.id_zawodnika) > 0
        AND
        nba.czyObronca(z.id_zawodnika) = TRUE
    ORDER BY PPG DESC;

-- widok laczacy zawodnikow ktorzy moge byc skrzydlowymi wraz z ich statystykami wyrazonymi jako srednie na mecz
CREATE VIEW nba.widok_statystyki_skrzydlowych AS
    SELECT z.id_zawodnika,
        z.nazwisko_zawodnika,
        z.imie_zawodnika,
        z.pozycja_zawodnika,
        z.numer_koszulki,
        z.zarobki_zawodnika,
        ROUND(
        ((SELECT SUM(punkty_zawodnika)::float 
            FROM nba.statystyki_meczu 
            WHERE id_zawodnika = z.id_zawodnika
        )/(SELECT COUNT(*)
            FROM nba.statystyki_meczu 
            WHERE id_zawodnika = z.id_zawodnika
        ))::numeric, 2) AS PPG,
        ROUND(
        ((SELECT SUM(asysty_zawodnika)::float 
            FROM nba.statystyki_meczu 
            WHERE id_zawodnika = z.id_zawodnika
        )/(SELECT COUNT(*)
            FROM nba.statystyki_meczu 
            WHERE id_zawodnika = z.id_zawodnika
        ))::numeric, 2) AS APG,
        ROUND(
        ((SELECT SUM(zbiorki_zawodnika)::float 
            FROM nba.statystyki_meczu 
            WHERE id_zawodnika = z.id_zawodnika
        )/(SELECT COUNT(*)
            FROM nba.statystyki_meczu 
            WHERE id_zawodnika = z.id_zawodnika
        ))::numeric, 2) AS RPG,
        ROUND(
        ((SELECT SUM(przechwyty_zawodnika)::float 
            FROM nba.statystyki_meczu 
            WHERE id_zawodnika = z.id_zawodnika
        )/(SELECT COUNT(*)
            FROM nba.statystyki_meczu 
            WHERE id_zawodnika = z.id_zawodnika
        ))::numeric, 2) AS SPG,
        ROUND(
        ((SELECT SUM(straty_zawodnika)::float 
            FROM nba.statystyki_meczu 
            WHERE id_zawodnika = z.id_zawodnika
        )/(SELECT COUNT(*)
            FROM nba.statystyki_meczu 
            WHERE id_zawodnika = z.id_zawodnika
        ))::numeric, 2) AS TPG
    FROM nba.zawodnicy z
    WHERE (
        SELECT COUNT(*) FROM nba.statystyki_meczu WHERE id_zawodnika = z.id_zawodnika) > 0
        AND
        nba.czySkrzydlowy(z.id_zawodnika) = TRUE
    ORDER BY PPG DESC;

-- widok laczacy zawodnikow ktorzy moge byc centrami wraz z ich statystykami wyrazonymi jako srednie na mecz
CREATE VIEW nba.widok_statystyki_centrow AS
    SELECT z.id_zawodnika,
        z.nazwisko_zawodnika,
        z.imie_zawodnika,
        z.pozycja_zawodnika,
        z.numer_koszulki,
        z.zarobki_zawodnika,
        ROUND(
        ((SELECT SUM(punkty_zawodnika)::float 
            FROM nba.statystyki_meczu 
            WHERE id_zawodnika = z.id_zawodnika
        )/(SELECT COUNT(*)
            FROM nba.statystyki_meczu 
            WHERE id_zawodnika = z.id_zawodnika
        ))::numeric, 2) AS PPG,
        ROUND(
        ((SELECT SUM(asysty_zawodnika)::float 
            FROM nba.statystyki_meczu 
            WHERE id_zawodnika = z.id_zawodnika
        )/(SELECT COUNT(*)
            FROM nba.statystyki_meczu 
            WHERE id_zawodnika = z.id_zawodnika
        ))::numeric, 2) AS APG,
        ROUND(
        ((SELECT SUM(zbiorki_zawodnika)::float 
            FROM nba.statystyki_meczu 
            WHERE id_zawodnika = z.id_zawodnika
        )/(SELECT COUNT(*)
            FROM nba.statystyki_meczu 
            WHERE id_zawodnika = z.id_zawodnika
        ))::numeric, 2) AS RPG,
        ROUND(
        ((SELECT SUM(przechwyty_zawodnika)::float 
            FROM nba.statystyki_meczu 
            WHERE id_zawodnika = z.id_zawodnika
        )/(SELECT COUNT(*)
            FROM nba.statystyki_meczu 
            WHERE id_zawodnika = z.id_zawodnika
        ))::numeric, 2) AS SPG,
        ROUND(
        ((SELECT SUM(straty_zawodnika)::float 
            FROM nba.statystyki_meczu 
            WHERE id_zawodnika = z.id_zawodnika
        )/(SELECT COUNT(*)
            FROM nba.statystyki_meczu 
            WHERE id_zawodnika = z.id_zawodnika
        ))::numeric, 2) AS TPG
    FROM nba.zawodnicy z
    WHERE (
        SELECT COUNT(*) FROM nba.statystyki_meczu WHERE id_zawodnika = z.id_zawodnika) > 0
        AND
        nba.czyCenter(z.id_zawodnika) = TRUE
    ORDER BY PPG DESC;
