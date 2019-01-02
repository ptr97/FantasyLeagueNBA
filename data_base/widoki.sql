-- Widoki

-- widok laczacy uzytkownikow z ich zespolami
CREATE VIEW nba.widok_uzytkownik_zespol AS SELECT uzyt.id_uzytkownika as uzyt_id, uzyt.email_uzytkownika as uzyt_email, zes.id_zespolu_uzytkownika as zes_id, zes.nazwa_zespolu_uzytkownika as zes_nazwa, zes.wynik_zespolu_uzytkownika as zes_wynik, zes.suma_wynagrodzen_zawodnikow as zes_wynagrodzenia, zes.budzet_zespolu_uzytkownika as zes_budzet FROM nba.uzytkownicy uzyt NATURAL JOIN nba.zespoly_uzytkownikow zes;

-- widok laczacy zespoly uzytkownikow z zawodnikami
CREATE VIEW nba.widok_zespol_uzyt_zawodnicy AS SELECT zes.id_zespolu_uzytkownika as zes_id, zes.nazwa_zespolu_uzytkownika as zes_nazwa, zzu.id_zawodnika as zaw_id, zaw.nazwisko_zawodnika as zaw_nazwisko, zaw.imie_zawodnika as zaw_imie, zaw.pozycja_zawodnika as zaw_poz, zaw.zarobki_zawodnika as zaw_zarobki FROM nba.zespoly_uzytkownikow zes NATURAL JOIN nba.zawodnicy_zespoly_uzytkownikow zzu NATURAL JOIN nba.zawodnicy zaw;

-- widok laczacy uzytkownikow z zawodnikami w ich zespolach
CREATE VIEW nba.widok_uzyt_zawodnicy AS SELECT wuz.uzyt_id, wuz.uzyt_email, wuz.zes_id, wuz.zes_nazwa, wuz.zes_wynik, wuz.zes_wynagrodzenia, zzu.zaw_id, zzu.zaw_imie, zzu.zaw_nazwisko, zzu.zaw_poz, zzu.zaw_zarobki FROM nba.widok_uzytkownik_zespol wuz JOIN nba.widok_zespol_uzyt_zawodnicy zzu USING (zes_id);

-- widok zawodnikow ktorzy moga byc obroncami ('G' - guard)
CREATE VIEW nba.obroncy AS SELECT * FROM nba.zawodnicy WHERE POSITION('G' IN pozycja_zawodnika) > 0;

-- widok zawodnikow ktorzy moga byc skrzydlowymi ('F' - forward)
CREATE VIEW nba.skrzydlowi AS SELECT * FROM nba.zawodnicy WHERE POSITION('F' IN pozycja_zawodnika) > 0;

-- widok zawodnikow ktorzy moga byc centrami ('C' - center)
CREATE VIEW nba.centrzy AS SELECT * FROM nba.zawodnicy WHERE POSITION('C' IN pozycja_zawodnika) > 0;
