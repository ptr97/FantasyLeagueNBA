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
