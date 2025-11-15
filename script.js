// Base URL สำหรับ API ของคุณ (Host บน Vercel)
const BASE_URL = "https://app-l9pwqf4vx-eakapaks-projects.vercel.app/api/users";
const MESSAGE_BOX = document.getElementById('message-box');

/**
 * แสดงข้อความแจ้งเตือน (Alert Message Box)
 * @param {string} message - ข้อความที่จะแสดง
 * @param {string} type - 'success' หรือ 'error'
 */
function showMessage(message, type = 'success') {
    MESSAGE_BOX.textContent = message;
    MESSAGE_BOX.className = `message-box show ${type}`;
    // ซ่อนข้อความหลังจาก 5 วินาที
    setTimeout(() => {
        MESSAGE_BOX.className = 'message-box';
    }, 5000);
}

/**
 * ฟังก์ชันหลักในการส่ง API Request
 * @param {string} url - URL ของ Endpoint
 * @param {string} method - HTTP Method (GET, POST, PUT, DELETE)
 * @param {object} [data=null] - Payload สำหรับ POST/PUT
 * @returns {Promise<object>} - Response JSON
 */
async function sendRequest(url, method, data = null) {
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        },
    };

    if (data) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(url, options);
        let result;

        // พยายามอ่าน response body เป็น JSON
        try {
            result = await response.json();
        } catch (e) {
            // กรณีไม่มี body หรือ body ไม่ใช่ JSON (เช่น DELETE 204 No Content)
            result = { message: response.statusText || `${method} successful with status ${response.status}` };
        }

        if (!response.ok) {
            const errorMsg = result.error || 'Unknown Error';
            const detailMsg = result.detail ? ` (${result.detail})` : '';
            throw new Error(`[${response.status} ${response.statusText}] ${errorMsg}${detailMsg}`);
        }

        // คืนค่า result (ซึ่งเป็น JSON response body)
        return result;

    } catch (error) {
        // โยน Error เพื่อให้ handleResult แสดงผล
        throw error;
    }
}

/**
 * แสดงผลลัพธ์บนหน้าเว็บ
 * @param {string} elementId - ID ของ <pre> element ที่จะแสดงผล
 * @param {object} result - ผลลัพธ์ JSON
 * @param {string} method - HTTP Method
 * @param {boolean} isError - เป็น Error หรือไม่
 */
function displayResult(elementId, result, method, isError = false) {
    const preElement = document.getElementById(elementId);
    if (!preElement) return;

    preElement.textContent = JSON.stringify(result, null, 2);
    
    // ตั้งค่าสีข้อความตามผลลัพธ์
    preElement.style.color = isError ? '#ff5555' : '#00ffaa';

    // แสดงข้อความแจ้งเตือน
    const status = isError ? 'error' : 'success';
    let message = isError 
        ? `${method} FAILED: ${result.message}` 
        : `${method} Successful.`;
    
    // ถ้าเป็น GET ALL หรือ POST ให้แสดงข้อมูลที่สร้างหรือจำนวน
    if (method === 'POST' && !isError) {
        message = `User ID: ${result.id} created successfully!`;
    } else if (method === 'GET' && elementId === 'get-list-data' && Array.isArray(result) && !isError) {
        message = `Found ${result.length} users.`;
    } else if (method === 'DELETE' && !isError) {
        message = `User ID: ${result.deleted} deleted successfully.`;
    }
    
    showMessage(message, status);
}

/**
 * Handler สำหรับ GET /api/users (List All)
 */
document.getElementById('get-all-btn').addEventListener('click', async () => {
    const resultId = 'get-list-data';
    displayResult(resultId, { message: 'Loading...' }, 'GET');
    
    try {
        const result = await sendRequest(BASE_URL, 'GET');
        displayResult(resultId, result, 'GET');
    } catch (error) {
        console.error('GET All Error:', error);
        displayResult(resultId, { message: error.message }, 'GET', true);
    }
});

/**
 * Handler สำหรับ POST /api/users (Create)
 */
document.getElementById('post-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const resultId = 'post-data';
    const form = e.target;
    
    // ดึงค่าจากฟอร์ม
    const data = {
        id: form.elements['post-id'].value.trim() || undefined, // undefined ถ้าเป็นค่าว่าง
        name: form.elements['post-name'].value.trim(),
        email: form.elements['post-email'].value.trim(),
        role: form.elements['post-role'].value.trim(),
    };

    // ลบ key ที่เป็นค่าว่างสำหรับ optional fields
    Object.keys(data).forEach(key => (data[key] === '' || data[key] === undefined) && delete data[key]);
    
    displayResult(resultId, data, 'POST');

    try {
        const result = await sendRequest(BASE_URL, 'POST', data);
        displayResult(resultId, result, 'POST');
    } catch (error) {
        console.error('POST Error:', error);
        displayResult(resultId, { message: error.message }, 'POST', true);
    }
});

/**
 * Handler สำหรับ GET /api/users/{id} (Get One)
 */
document.getElementById('get-one-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const resultId = 'get-one-data';
    const userId = e.target.elements['get-one-id'].value.trim();
    
    if (!userId) {
        displayResult(resultId, { message: 'User ID is required for GET one.' }, 'GET', true);
        return;
    }

    const url = `${BASE_URL}/${userId}`;
    displayResult(resultId, { message: `GET ${url}` }, 'GET');

    try {
        const result = await sendRequest(url, 'GET');
        displayResult(resultId, result, 'GET');
    } catch (error) {
        console.error('GET One Error:', error);
        displayResult(resultId, { message: error.message }, 'GET', true);
    }
});

/**
 * Handler สำหรับ PUT /api/users/{id} (Update)
 */
document.getElementById('put-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const resultId = 'put-data';
    const form = e.target;
    const userId = form.elements['put-id'].value.trim();

    if (!userId) {
        displayResult(resultId, { message: 'User ID is required for PUT update.' }, 'PUT', true);
        return;
    }

    // ดึงค่าอัปเดตจากฟอร์ม, เฉพาะ field ที่มีค่าเท่านั้นที่จะถูกส่ง
    const data = {
        name: form.elements['put-name'].value.trim(),
        email: form.elements['put-email'].value.trim(),
        role: form.elements['put-role'].value.trim(),
    };

    // ลบ key ที่เป็นค่าว่างออก เพื่อไม่ให้ส่งค่าว่างไปอัปเดต
    Object.keys(data).forEach(key => data[key] === '' && delete data[key]);

    if (Object.keys(data).length === 0) {
        displayResult(resultId, { message: 'At least one field (Name, Email, or Role) must be provided for update.' }, 'PUT', true);
        return;
    }

    const url = `${BASE_URL}/${userId}`;
    displayResult(resultId, data, 'PUT');

    try {
        const result = await sendRequest(url, 'PUT', data);
        displayResult(resultId, result, 'PUT');
    } catch (error) {
        console.error('PUT Error:', error);
        displayResult(resultId, { message: error.message }, 'PUT', true);
    }
});

/**
 * Handler สำหรับ DELETE /api/users/{id} (Delete)
 */
document.getElementById('delete-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const resultId = 'delete-data';
    const userId = e.target.elements['delete-id'].value.trim();

    if (!userId) {
        displayResult(resultId, { message: 'User ID is required for DELETE.' }, 'DELETE', true);
        return;
    }

    const url = `${BASE_URL}/${userId}`;
    displayResult(resultId, { message: `Sending DELETE request to ${url}` }, 'DELETE');

    try {
        const result = await sendRequest(url, 'DELETE');
        displayResult(resultId, result, 'DELETE');
        // Clear forms related to the deleted ID for better UX (optional)
        document.getElementById('get-one-id').value = '';
        document.getElementById('put-id').value = '';
        document.getElementById('delete-id').value = '';

    } catch (error) {
        console.error('DELETE Error:', error);
        displayResult(resultId, { message: error.message }, 'DELETE', true);
    }
});