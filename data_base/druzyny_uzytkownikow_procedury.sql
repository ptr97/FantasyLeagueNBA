-- Procedury zapewniajace poprawna liczbe (5) zawodnikow w druzynie uzytkownika

CREATE FUNCTION nba.czyPrawidlowaLiczbaZawodnikow(liczba_zawodnikow int) RETURNS BOOLEAN AS $$
    BEGIN
        RETURN (liczba_zawodnikow = 5);
    END;
$$ LANGUAGE plpgsql;

CREATE FUNCTION nba.zapewnijPoprawnaIloscZawodnikow() RETURNS TRIGGER AS $$
    DECLARE
        liczba_zawodnikow int := 0;
    BEGIN
        SELECT INTO liczba_zawodnikow COUNT(*) FROM nba.zawodnicy_zespoly_uzytkownikow
            WHERE id_zespolu_uzytkownika = NEW.id_zespolu_uzytkownika;
        IF NOT(nba.czyPrawidlowaLiczbaZawodnikow(liczba_zawodnikow)) THEN
            RAISE EXCEPTION 'Nieprawidlowa ilosc zawodnikow w druzynie!' USING 
                DETAIL = 'Nieprawidlowa ilosc zawodnikow w druzynie! Twoja druzyna sklada sie z ' || liczba_zawodnikow || ' zawodnikow',
                HINT = 'Druzyna powinna skladac sie z 5 zawodnikow.';
            RETURN NULL;
        ELSE
            RETURN NEW;
        END IF;
    END;
$$ LANGUAGE plpgsql;

CREATE CONSTRAINT TRIGGER _01_zapewnijPoprawnaIloscZawodnikow 
    AFTER INSERT OR UPDATE ON nba.zawodnicy_zespoly_uzytkownikow 
    INITIALLY DEFERRED
    FOR EACH ROW EXECUTE PROCEDURE nba.zapewnijPoprawnaIloscZawodnikow();


-- Procedury zapewniajace niepowtarzalnosc zawodnikow w druzynie 

CREATE FUNCTION nba.zapewnijNiepowtarzalnoscZawodnikow() RETURNS TRIGGER AS $$
    BEGIN
        IF(
            EXISTS(SELECT id_zawodnika, COUNT(*) FROM 
                nba.zawodnicy_zespoly_uzytkownikow
                WHERE id_zespolu_uzytkownika = NEW.id_zespolu_uzytkownika 
                GROUP BY id_zawodnika
                HAVING COUNT(*) > 1
                )
            ) THEN
                RAISE EXCEPTION 'W druzynie powtarzaja sie zawodnicy!' USING 
                    DETAIL = 'W druzynie powtarzaja sie zawodnicy!',
                    HINT = 'Druzyna powinna skladac sie z 5 roznych zawodnikow.';
                RETURN NULL;
        ELSE
            RETURN NEW;
        END IF;
    END;
$$ LANGUAGE plpgsql;

CREATE CONSTRAINT TRIGGER _02_zapewnijNiepowtarzalnoscZawodnikow 
    AFTER INSERT OR UPDATE ON nba.zawodnicy_zespoly_uzytkownikow 
    INITIALLY DEFERRED
    FOR EACH ROW EXECUTE PROCEDURE nba.zapewnijNiepowtarzalnoscZawodnikow();

-- SELECT id_zawodnika, COUNT(*) FROM 
--                 nba.zawodnicy_zespoly_uzytkownikow
--                 WHERE id_zespolu_uzytkownika = 1 
--                 GROUP BY id_zawodnika
--                 HAVING COUNT(*) > 1

-- SELECT * FROM nba.zawodnicy_zespoly_uzytkownikow WHERE

-- Procedury zapewniajace poprawnosc pozycji przy tworzeniu lub modyfikacji druzyny uzytkownika

CREATE FUNCTION nba.czyObronca(id bigint) RETURNS BOOLEAN AS $$
    BEGIN
        RETURN EXISTS(SELECT * FROM nba.zawodnicy WHERE id_zawodnika = id AND POSITION('G' IN pozycja_zawodnika) > 0);
    END;
$$ LANGUAGE plpgsql;

CREATE FUNCTION nba.czySkrzydlowy(id bigint) RETURNS BOOLEAN AS $$
    BEGIN
        RETURN EXISTS(SELECT * FROM nba.zawodnicy WHERE id_zawodnika = id AND POSITION('F' IN pozycja_zawodnika) > 0);
    END;
$$ LANGUAGE plpgsql;

CREATE FUNCTION nba.czyCenter(id bigint) RETURNS BOOLEAN AS $$
    BEGIN
        RETURN EXISTS(SELECT * FROM nba.zawodnicy WHERE id_zawodnika = id AND POSITION('C' IN pozycja_zawodnika) > 0);
    END;
$$ LANGUAGE plpgsql;

-- Obroncy

CREATE FUNCTION nba.zapewnijPoprawnoscObroncow() RETURNS TRIGGER AS $$
    DECLARE
        liczba_obroncow int := 0;
    BEGIN
        SELECT INTO liczba_obroncow COUNT(*) FROM nba.zawodnicy_zespoly_uzytkownikow zzu 
            NATURAL JOIN nba.zawodnicy zaw 
            WHERE zzu.id_zespolu_uzytkownika = NEW.id_zespolu_uzytkownika 
            AND nba.czyObronca(zaw.id_zawodnika);
        IF(liczba_obroncow < 2) THEN
            RAISE EXCEPTION 'Niewystarczajaca ilosc obroncow (< 2) w druzynie!' USING 
                DETAIL = 'Niewystarczajaca ilosc obroncow (< 2) w druzynie! Twoja druzyna sklada sie z ' || liczba_obroncow || ' obroncow',
                HINT = 'W druzynie powinno byc dwoch obroncow.';
            RETURN NULL;
        ELSE
            RETURN NEW;
        END IF;
    END;
$$ LANGUAGE plpgsql;

CREATE CONSTRAINT TRIGGER _03_zapewnijPoprawnoscObroncow 
    AFTER INSERT OR UPDATE ON nba.zawodnicy_zespoly_uzytkownikow 
    INITIALLY DEFERRED
    FOR EACH ROW EXECUTE PROCEDURE nba.zapewnijPoprawnoscObroncow();

-- Skrzydlowi

CREATE FUNCTION nba.zapewnijPoprawnoscSkrzydlowych() RETURNS TRIGGER AS $$
    DECLARE
        liczba_skrzydlowych int := 0;
    BEGIN
        SELECT INTO liczba_skrzydlowych COUNT(*) FROM nba.zawodnicy_zespoly_uzytkownikow zzu 
            NATURAL JOIN nba.zawodnicy zaw 
            WHERE zzu.id_zespolu_uzytkownika = NEW.id_zespolu_uzytkownika 
            AND nba.czySkrzydlowy(zaw.id_zawodnika);
        IF(liczba_skrzydlowych < 2) THEN
            RAISE EXCEPTION 'Niewystarczajaca ilosc skrzydlowych (< 2) w druzynie!' USING 
                DETAIL = 'Niewystarczajaca ilosc skrzydlowych (< 2) w druzynie! Twoja druzyna sklada sie z ' || liczba_skrzydlowych || ' skrzydlowych',
                HINT = 'W druzynie powinno byc dwoch skrzydlowych.';
            RETURN NULL;
        ELSE
            RETURN NEW;
        END IF;
    END;
$$ LANGUAGE plpgsql;

CREATE CONSTRAINT TRIGGER _04_zapewnijPoprawnoscskrzydlowych 
    AFTER INSERT OR UPDATE ON nba.zawodnicy_zespoly_uzytkownikow 
    INITIALLY DEFERRED
    FOR EACH ROW EXECUTE PROCEDURE nba.zapewnijPoprawnoscskrzydlowych();

-- Centrzy

CREATE FUNCTION nba.zapewnijPoprawnoscCentrow() RETURNS TRIGGER AS $$
    DECLARE
        liczba_centrow int := 0;
    BEGIN
        SELECT INTO liczba_centrow COUNT(*) FROM nba.zawodnicy_zespoly_uzytkownikow zzu 
            NATURAL JOIN nba.zawodnicy zaw 
            WHERE zzu.id_zespolu_uzytkownika = NEW.id_zespolu_uzytkownika 
            AND nba.czyCenter(zaw.id_zawodnika);
        IF(liczba_centrow < 1) THEN
            RAISE EXCEPTION 'Niewystarczajaca ilosc centrow (< 1) w druzynie!' USING 
                DETAIL = 'Niewystarczajaca ilosc centrow (< 1) w druzynie! Twoja druzyna sklada sie z ' || liczba_centrow || ' centrow',
                HINT = 'W druzynie powinien byc jeden center.';
            RETURN NULL;
        ELSE
            RETURN NEW;
        END IF;
    END;
$$ LANGUAGE plpgsql;

CREATE CONSTRAINT TRIGGER _05_zapewnijPoprawnoscCentrow 
    AFTER INSERT OR UPDATE ON nba.zawodnicy_zespoly_uzytkownikow 
    INITIALLY DEFERRED
    FOR EACH ROW EXECUTE PROCEDURE nba.zapewnijPoprawnoscCentrow();


-- Procedury zapewniajace zgodnosc budzetu druzyny uzytkownika

CREATE FUNCTION nba.policzZarobkiZawodnikow() RETURNS TRIGGER AS $$
    DECLARE
        suma_zarobkow int := 0;
    BEGIN
        SELECT INTO suma_zarobkow SUM(z.zarobki_zawodnika) 
            FROM nba.zawodnicy_zespoly_uzytkownikow zzu 
            NATURAL JOIN nba.zawodnicy z 
            WHERE id_zawodnika IN 
                (SELECT id_zawodnika FROM nba.zawodnicy_zespoly_uzytkownikow 
                WHERE id_zespolu_uzytkownika = NEW.id_zespolu_uzytkownika);

        UPDATE nba.zespoly_uzytkownikow SET suma_wynagrodzen_zawodnikow = suma_zarobkow 
            WHERE id_zespolu_uzytkownika = NEW.id_zespolu_uzytkownika;
        RETURN NEW;
    END;
$$ LANGUAGE plpgsql;

CREATE CONSTRAINT TRIGGER _06_policzZarobkiZawodnikow 
    AFTER INSERT OR UPDATE ON nba.zawodnicy_zespoly_uzytkownikow 
    INITIALLY DEFERRED
    FOR EACH ROW EXECUTE PROCEDURE nba.policzZarobkiZawodnikow();

