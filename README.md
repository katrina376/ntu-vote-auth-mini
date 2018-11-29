# NTU Vote Authentication MINI

Dat authentication service implemented with [Google Apps Script](https://developers.google.com/apps-script/) (eventually).

Developed by [Katrina H.-Y. Chan](https://katrina.tw) for NTU Student Association. Inspired by [MouseMs](https://github.com/mousems)'s version of the vote authentication system developed in May 2016.

## Deployment

1. Clone this repository using Git.
2. Setup the spreadsheet as the database.
3. Copy the configuration file, edit the parameters (including the ID of spreadsheet), and re-name it into `*.js`.
4. Upload the scripts using [Clasp](https://github.com/google/clasp).
5. Deploy.

## TODOs

- Restrict the number of available session per station.
- Panel for the commissioners (basically Muggles) to manage sessions.
- Re-write the messages in proper English and Mandarin.
- Automatic spreadsheet creator or field checker

## API

### Request

```json
{
  "token": "__TOKEN__",
  "body": {}
}
```

### Response

```json
{
  "status": 200,
  "token": "__TOKEN__",
  "body": {},
  "error": "__ERROR_MESSAGE__"
}
```

### Error code

- 200 "OK"
- 201 "Created"
- 400 "Bad request"
- 403 "Unauthorized"
- 404 "Not found"

### Available ballot conditions

- `id`: <String\> student ID
- `valid`: <Boolean\> in campus or not
- `dptCode`: <String\> 4-digit department code
- `type`
  - `name`: <String\> display name of student type
  - `code`: <String\> 1-digit code of student type
- `college`
  - `name`: <String\> college display name
  - `code`: <String\> 1-digit code of college

### Cache

- key: <String\> token for authorization
- value:
  - `station`:
    - `id`: <String\> station ID
    - `displayName`: <String\> station display name
  - `student`:
    - `id`: <String\> student ID
    - `ballots`: <Array(String)\> list of available ballot names
  
