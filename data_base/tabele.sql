DROP SCHEMA IF EXISTS nba CASCADE;
CREATE SCHEMA nba;

-- Tabele

-- Oficjalne zespoly
CREATE DOMAIN nba.triCode AS varchar(5) NOT NULL CHECK (VALUE ~ '^[A-Z]{3}$');

CREATE TABLE nba.oficjalne_zespoly (
    id_oficjalnego_zespolu bigint,
    nazwa_oficjalnego_zespolu varchar(40) unique not null,
    kod_oficjalnego_zespolu nba.triCode unique,
    dywizja_oficjalnego_zespolu varchar(20) not null,
    konferencja_oficjalnego_zespolu varchar(20) not null,
    PRIMARY KEY (id_oficjalnego_zespolu)
);

-- Zawodnicy
CREATE DOMAIN nba.position AS varchar(5) NOT NULL CHECK (VALUE ~ '^[GFC](-[GFC])?$');
CREATE DOMAIN nba.jerseyNo AS varchar(3) NOT NULL CHECK (VALUE ~ '^[0-9]{1,2}$');
CREATE DOMAIN nba.salary AS int DEFAULT 70 CHECK (VALUE > 0 AND VALUE <= 100);
CREATE DOMAIN nba.weight AS numeric(4, 1) NOT NULL CHECK (VALUE > 50.0 AND VALUE < 180.0);
CREATE DOMAIN nba.height AS numeric(4, 2) NOT NULL CHECK (VALUE > 1.40 AND VALUE < 2.60);

CREATE TABLE nba.zawodnicy (
    id_zawodnika bigint,
    id_oficjalnego_zespolu bigint,
    nazwisko_zawodnika varchar(40) not null,
    imie_zawodnika varchar(40) not null,
    pozycja_zawodnika nba.position,
    numer_koszulki nba.jerseyNo,
    zarobki_zawodnika nba.salary,
    waga_zawodnika nba.weight,
    wzrost_zawodnika nba.height,
    PRIMARY KEY (id_zawodnika),
    FOREIGN KEY (id_oficjalnego_zespolu) REFERENCES nba.oficjalne_zespoly(id_oficjalnego_zespolu) ON DELETE SET NULL
);

-- mecze
CREATE DOMAIN nba.game_day AS varchar(9) CHECK (VALUE ~ '^(201[8-9])(0[1-9]|1[012])(0[1-9]|[12][0-9]|3[01])$');

CREATE TABLE nba.mecze (
    id_meczu varchar(20),
    data_meczu nba.game_day,
    id_zespolu_gospodarzy bigint,
    id_zespolu_gosci bigint,
    punkty_zespolu_gospodarzy int,
    punkty_zespolu_gosci int,
    PRIMARY KEY (id_meczu, data_meczu),
    FOREIGN KEY (id_zespolu_gospodarzy) REFERENCES nba.oficjalne_zespoly(id_oficjalnego_zespolu) ON DELETE CASCADE,
    FOREIGN KEY (id_zespolu_gosci) REFERENCES nba.oficjalne_zespoly(id_oficjalnego_zespolu) ON DELETE CASCADE
);

CREATE TABLE nba.statystyki_meczu (
    id_zawodnika bigint,
    id_meczu varchar(20),
    data_meczu nba.game_day,
    punkty_zawodnika int,
    asysty_zawodnika int,
    zbiorki_zawodnika int,
    przechwyty_zawodnika int,
    straty_zawodnika int,
    PRIMARY KEY (id_zawodnika, id_meczu, data_meczu),
    FOREIGN KEY (id_zawodnika) REFERENCES nba.zawodnicy(id_zawodnika) ON DELETE CASCADE,
    FOREIGN KEY (id_meczu, data_meczu) REFERENCES nba.mecze(id_meczu, data_meczu) ON DELETE CASCADE
);

-- uzytkownicy
CREATE SEQUENCE nba.id_uzytkownika_sequence INCREMENT 1 MINVALUE 1 MAXVALUE 9999999 START 1;
CREATE SEQUENCE nba.id_zespolu_uzytkownika_sequence INCREMENT 1 MINVALUE 1 MAXVALUE 9999999 START 1;

CREATE TABLE nba.uzytkownicy (
    id_uzytkownika bigint default nextval('nba.id_uzytkownika_sequence'),
    email_uzytkownika varchar(40) not null unique,
    haslo_uzytkownika varchar(100) not null,
    imie_uzytkownika varchar(40) not null,
    nazwisko_uzytkownika varchar(40) not null,
    PRIMARY KEY (id_uzytkownika)
);

-- zespoly uzytkownikow
CREATE TABLE nba.zespoly_uzytkownikow (
    id_zespolu_uzytkownika bigint default nextval('nba.id_zespolu_uzytkownika_sequence'),
    id_uzytkownika bigint not null,
    wynik_zespolu_uzytkownika bigint default 0,
    budzet_zespolu_uzytkownika int default 440 CHECK (budzet_zespolu_uzytkownika > 0),
    nazwa_zespolu_uzytkownika varchar(40) unique,
    PRIMARY KEY (id_zespolu_uzytkownika),
    FOREIGN KEY (id_uzytkownika) REFERENCES nba.uzytkownicy(id_uzytkownika) ON DELETE CASCADE
);

CREATE TABLE nba.zawodnicy_zespoly_uzytkownikow (
    id_zawodnika bigint,
    id_zespolu_uzytkownika bigint,
    wartosc_kontraktu int DEFAULT 0 CHECK (wartosc_kontraktu >= 0),
    FOREIGN KEY (id_zawodnika) REFERENCES nba.zawodnicy(id_zawodnika) ON DELETE CASCADE,
    FOREIGN KEY (id_zespolu_uzytkownika) REFERENCES nba.zespoly_uzytkownikow(id_zespolu_uzytkownika) ON DELETE CASCADE
);
