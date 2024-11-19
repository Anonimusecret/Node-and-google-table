import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library'

import creds from './node-js-table-36700-c8e9d5be6de6.json' assert { type: "json" };

const SCOPES = [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive.file',
];

const jwt = new JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: SCOPES,
});

const doc = new GoogleSpreadsheet('1YI61L2cbD5Bd59fGuLb3eYrYdK-F4KZgaKUFfFdrLN8', jwt);


await doc.loadInfo(); // loads document properties and worksheets

const sheet = doc.sheetsByIndex[0]; // or use `doc.sheetsById[id]` or `doc.sheetsByTitle[title]`

let username = 'Anonimusecret';
let tokenAPI;

async function register(username) {
    let input = {"username": username}

    let response = await fetch('http://94.103.91.4:5000/auth/registration', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json;charset=utf-8'
        },
            body: JSON.stringify(input)
        });

        let result = await response.json();

        if (result.token){
            console.log('Пользователь создан. Токен = ' + result.token)
            tokenAPI = result.token
            return true
        }else{
            console.log('Пользователь уже существует, попробуйте /login')
            return true
        }

}

async function login(username) {
    let input = {"username": username}

    let response = await fetch('http://94.103.91.4:5000/auth/login',  {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json;charset=utf-8'
        },
            body: JSON.stringify(input)
        });

        let result = await response.json();
        if (result.token){
            console.log('Пользователь авторизован. Токен = ' + result.token)
            tokenAPI = result.token
            return true
        }else{
            console.log('Пользователь не найден, попробуйте /reg')
            return false
        }
        

}
async function getClientsList() { //получаем клиентов без статуса

    let response = await fetch('http://94.103.91.4:5000/clients',  {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json;charset=utf-8',
            'Authorization': tokenAPI,
        },
        });

        let result = await response.json();
        if (result.length > 0){
            console.log('Пользователи получены ' + result.length)
            return result
        }else{
            console.log('Ошибка авторизации ' + result.status)
        }

}

async function getClientsStatus() { //получаем и клиентов и их статус

    let clientsList = await getClientsList()
    let userIds = []

    for (let i = 0 ; i < clientsList.length ; i++){

        userIds[i] = clientsList[i].id

    }

    let input = {"userIds": userIds}
    
    let response = await fetch('http://94.103.91.4:5000/clients',  {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json;charset=utf-8',
            'Authorization': tokenAPI,
        },
            body: JSON.stringify(input)
        });

        let result = await response.json();
        if (result.length > 0){

            for (let i = 0 ; i < clientsList.length ; i++){

                clientsList[i].status = result[i].status
        
            }
            return clientsList

        }else{
            console.log('Ошибка при получении статусов')
        }

}

async function printClients() {
    if (await login(username) || await register(username)) {

        let clientsList = await getClientsStatus()
        await sheet.setHeaderRow([
            'id',
            'firstName',
            'lastName',
            'gender',
            'address',
            'city',
            'phone',
            'email',
            'status',
        ]);

        sheet.clearRows() //Очищаем таблицу

        try {
            await sheet.addRows(clientsList); // Заполняем таблицу
            console.log('Таблица заполнена')
        } catch (error) {
            console.log(error)
        }
        
        
    }
}

printClients()