-- Procedury aktualizujace zarobki zawodnika po wstawieniu nowych statystyk z meczu

CREATE FUNCTION nba.aktualizujZarobkiZawodnikow() RETURNS TRIGGER AS $$
    DECLARE
        wynik_zawodnika int := 0;
    BEGIN
        SELECT INTO wynik_zawodnika ((PPG * 1.2) + APG + RPG + SPG - TPG) 
            FROM nba.widok_statystyki_zawodnikow WHERE id_zawodnika = NEW.id_zawodnika;
        IF(wynik_zawodnika >= 50) THEN
            wynik_zawodnika := 50;
        ELSIF(wynik_zawodnika <= 30) THEN
            wynik_zawodnika := 30;
        END IF;
        UPDATE nba.zawodnicy SET zarobki_zawodnika = 2 * wynik_zawodnika WHERE id_zawodnika = NEW.id_zawodnika;
        RETURN NEW;
    END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER _01_aktualizujZarobkiZawodnikow 
    AFTER INSERT ON nba.statystyki_meczu
    FOR EACH ROW EXECUTE PROCEDURE nba.aktualizujZarobkiZawodnikow();

-- Procedury aktualizujace wyniki druzyn zawodnikow po wstawieniu nowych statystyk z meczow

CREATE FUNCTION nba.aktualizujWynikiZespolow() RETURNS TRIGGER AS $$
    DECLARE
        zdobycze_zawodnika int;
        zawodnik_zespol nba.zawodnicy_zespoly_uzytkownikow%ROWTYPE;
        stary_wynik_druzyny int;
        nowy_wynik_druzyny int;
    BEGIN
        zdobycze_zawodnika := NEW.punkty_zawodnika + NEW.asysty_zawodnika + NEW.zbiorki_zawodnika + NEW.przechwyty_zawodnika - NEW.straty_zawodnika;

        FOR zawodnik_zespol IN SELECT * FROM nba.zawodnicy_zespoly_uzytkownikow WHERE id_zawodnika = NEW.id_zawodnika LOOP
            SELECT INTO stary_wynik_druzyny wynik_zespolu_uzytkownika FROM nba.zespoly_uzytkownikow WHERE id_zespolu_uzytkownika = zawodnik_zespol.id_zespolu_uzytkownika;
            nowy_wynik_druzyny := stary_wynik_druzyny + zdobycze_zawodnika;
            UPDATE nba.zespoly_uzytkownikow SET wynik_zespolu_uzytkownika = nowy_wynik_druzyny WHERE id_zespolu_uzytkownika = zawodnik_zespol.id_zespolu_uzytkownika;
        END LOOP;

        RETURN NEW;
    END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER _02_aktualizujWynikiZespolow
    AFTER INSERT ON nba.statystyki_meczu
    FOR EACH ROW EXECUTE PROCEDURE nba.aktualizujWynikiZespolow();
