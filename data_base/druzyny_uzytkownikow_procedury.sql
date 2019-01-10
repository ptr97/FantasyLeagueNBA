-- Procedura aktualizujaca wartosci kontraktow zawodnikow w druzynach
CREATE FUNCTION nba.podpiszKontraktyZawodnikow() RETURNS TRIGGER AS $$
    DECLARE
        obecne_zarobki_zawodnika int;
    BEGIN
        IF(NEW.wartosc_kontraktu = 0 OR NEW.wartosc_kontraktu IS NULL) THEN
            SELECT INTO obecne_zarobki_zawodnika zarobki_zawodnika FROM nba.zawodnicy WHERE id_zawodnika = NEW.id_zawodnika;
            UPDATE nba.zawodnicy_zespoly_uzytkownikow SET wartosc_kontraktu = obecne_zarobki_zawodnika WHERE id_zawodnika = NEW.id_zawodnika AND id_zespolu_uzytkownika = NEW.id_zespolu_uzytkownika;
        END IF;
        RETURN NEW;
    END;
$$ LANGUAGE plpgsql;

CREATE CONSTRAINT TRIGGER _01_podpiszKontraktyZawodnikow 
    AFTER INSERT ON nba.zawodnicy_zespoly_uzytkownikow 
    FOR EACH ROW EXECUTE PROCEDURE nba.podpiszKontraktyZawodnikow();


-- Procedury zapewniajace zgodnosc budzetu druzyny uzytkownika
CREATE OR REPLACE FUNCTION nba.zapewnijZgodnoscBudzetu() RETURNS TRIGGER AS $$
    DECLARE
        suma_zarobkow int;
        budzet_druzyny int;
    BEGIN 
        WITH zawodnicy_tej_druzyny AS 
            (SELECT id_zawodnika, wartosc_kontraktu FROM nba.zawodnicy_zespoly_uzytkownikow 
                WHERE id_zespolu_uzytkownika = NEW.id_zespolu_uzytkownika)
        SELECT INTO suma_zarobkow SUM(ztd.wartosc_kontraktu) FROM zawodnicy_tej_druzyny ztd;

        SELECT INTO budzet_druzyny budzet_zespolu_uzytkownika FROM nba.zespoly_uzytkownikow WHERE id_zespolu_uzytkownika = NEW.id_zespolu_uzytkownika;

        IF (suma_zarobkow > budzet_druzyny) THEN
            RAISE EXCEPTION 'Przekroczono budzet zespolu!' USING 
                DETAIL = 'Przekroczono budzet zespolu!',
                HINT = 'Budzet zespolu = ' || budzet_druzyny || ', natomiast suma zarobkow zawodnikow = ' || suma_zarobkow || '.';
        ELSE
            RETURN NEW;
        END IF;
    END;
$$ LANGUAGE plpgsql;

CREATE CONSTRAINT TRIGGER _02_zapewnijZgodnoscBudzetu 
    AFTER INSERT OR UPDATE ON nba.zawodnicy_zespoly_uzytkownikow 
    INITIALLY DEFERRED
    FOR EACH ROW EXECUTE PROCEDURE nba.zapewnijZgodnoscBudzetu();



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
                DETAIL = 'Nieprawidlowa ilosc zawodnikow w druzynie! Twoja druzyna sklada sie z ' || liczba_zawodnikow || ' zawodnikow.',
                HINT = 'Druzyna powinna skladac sie z 5 zawodnikow.';
            RETURN NULL;
        ELSE
            RETURN NEW;
        END IF;
    END;
$$ LANGUAGE plpgsql;

CREATE CONSTRAINT TRIGGER _03_zapewnijPoprawnaIloscZawodnikow 
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

CREATE CONSTRAINT TRIGGER _04_zapewnijNiepowtarzalnoscZawodnikow 
    AFTER INSERT OR UPDATE ON nba.zawodnicy_zespoly_uzytkownikow 
    INITIALLY DEFERRED
    FOR EACH ROW EXECUTE PROCEDURE nba.zapewnijNiepowtarzalnoscZawodnikow();


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
                DETAIL = 'Niewystarczajaca ilosc obroncow (< 2) w druzynie! Twoja druzyna sklada sie z ' || liczba_obroncow || ' obroncow.',
                HINT = 'W druzynie powinno byc dwoch obroncow.';
            RETURN NULL;
        ELSE
            RETURN NEW;
        END IF;
    END;
$$ LANGUAGE plpgsql;

CREATE CONSTRAINT TRIGGER _05_zapewnijPoprawnoscObroncow 
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
                DETAIL = 'Niewystarczajaca ilosc skrzydlowych (< 2) w druzynie! Twoja druzyna sklada sie z ' || liczba_skrzydlowych || ' skrzydlowych.',
                HINT = 'W druzynie powinno byc dwoch skrzydlowych.';
            RETURN NULL;
        ELSE
            RETURN NEW;
        END IF;
    END;
$$ LANGUAGE plpgsql;

CREATE CONSTRAINT TRIGGER _06_zapewnijPoprawnoscskrzydlowych 
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
                DETAIL = 'Niewystarczajaca ilosc centrow (< 1) w druzynie! Twoja druzyna sklada sie z ' || liczba_centrow || ' centrow.',
                HINT = 'W druzynie powinien byc jeden center.';
            RETURN NULL;
        ELSE
            RETURN NEW;
        END IF;
    END;
$$ LANGUAGE plpgsql;

CREATE CONSTRAINT TRIGGER _07_zapewnijPoprawnoscCentrow 
    AFTER INSERT OR UPDATE ON nba.zawodnicy_zespoly_uzytkownikow 
    INITIALLY DEFERRED
    FOR EACH ROW EXECUTE PROCEDURE nba.zapewnijPoprawnoscCentrow();

