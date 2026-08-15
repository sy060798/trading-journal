/* =========================================================
   TRADING JOURNAL
   API CONNECTION
   Google Apps Script + Google Sheets
========================================================= */


/* =========================================================
   GOOGLE APPS SCRIPT URL
========================================================= */

const API_URL =
  "https://script.google.com/macros/s/AKfycbypUxWIp8OemScOwiqDeLnnSjpfGb3bVZHw_pzPMIWFSUWiURc6rseuRi5bOZ9LFMGK_A/exec";


/* =========================================================
   BASIC CONFIG
========================================================= */

const API_CONFIG = {
  timeout: 30000
};


/* =========================================================
   REQUEST HELPER
========================================================= */

async function apiRequest(action, data = {}) {

  if (
    !API_URL ||
    API_URL.includes("GANTI_DENGAN")
  ) {
    throw new Error(
      "API_URL belum diisi dengan URL Google Apps Script."
    );
  }


  const controller =
    new AbortController();

  const timeout =
    setTimeout(
      () => controller.abort(),
      API_CONFIG.timeout
    );


  try {

    const params =
      new URLSearchParams();

    params.append(
      "action",
      action
    );


    Object.keys(data).forEach(key => {

      let value = data[key];


      /*
       * Object / Array
       * dikirim sebagai JSON
       */

      if (
        typeof value === "object" &&
        value !== null
      ) {

        value =
          JSON.stringify(value);

      }


      params.append(
        key,
        value ?? ""
      );

    });


    const response =
      await fetch(
        API_URL,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/x-www-form-urlencoded;charset=UTF-8"
          },

          body:
            params.toString(),

          signal:
            controller.signal
        }
      );


    if (!response.ok) {

      throw new Error(
        `HTTP Error ${response.status}`
      );

    }


    const text =
      await response.text();


    let result;


    try {

      result =
        JSON.parse(text);

    } catch (error) {

      console.error(
        "Response Google Apps Script:",
        text
      );

      throw new Error(
        "Response dari Google Apps Script bukan JSON yang valid."
      );

    }


    /*
     * Format response yang diharapkan:
     *
     * {
     *   success: true,
     *   message: "...",
     *   data: ...
     * }
     */

    if (
      result &&
      result.success === false
    ) {

      throw new Error(
        result.message ||
        "Google Apps Script mengembalikan error."
      );

    }


    return result;


  } catch (error) {

    if (
      error.name === "AbortError"
    ) {

      throw new Error(
        "Request timeout. Periksa koneksi atau Apps Script."
      );

    }


    throw error;


  } finally {

    clearTimeout(timeout);

  }

}


/* =========================================================
   GET ALL TRANSACTIONS
========================================================= */

async function getTransactions() {

  const result =
    await apiRequest(
      "getTransactions"
    );


  return (
    result?.data ||
    result?.transactions ||
    []
  );

}


/* =========================================================
   ADD TRANSACTION
========================================================= */

async function addTransaction(transaction) {

  if (!transaction) {

    throw new Error(
      "Data transaksi kosong."
    );

  }


  const result =
    await apiRequest(
      "addTransaction",
      {
        data: transaction
      }
    );


  return result;

}


/* =========================================================
   DELETE TRANSACTION
========================================================= */

async function deleteTransaction(id) {

  if (
    id === undefined ||
    id === null ||
    id === ""
  ) {

    throw new Error(
      "ID transaksi tidak ditemukan."
    );

  }


  return await apiRequest(
    "deleteTransaction",
    {
      id: id
    }
  );

}


/* =========================================================
   GET CAPITAL
========================================================= */

async function getCapital() {

  const result =
    await apiRequest(
      "getCapital"
    );


  return (
    result?.data ||
    result?.capital ||
    {}
  );

}


/* =========================================================
   ADD CAPITAL
========================================================= */

async function addCapital(
  amount,
  note = ""
) {

  amount =
    Number(amount);


  if (
    !Number.isFinite(amount) ||
    amount <= 0
  ) {

    throw new Error(
      "Nominal tambah modal tidak valid."
    );

  }


  return await apiRequest(
    "addCapital",
    {
      amount: amount,
      note: note
    }
  );

}


/* =========================================================
   WITHDRAW CAPITAL
========================================================= */

async function withdrawCapital(
  amount,
  note = ""
) {

  amount =
    Number(amount);


  if (
    !Number.isFinite(amount) ||
    amount <= 0
  ) {

    throw new Error(
      "Nominal penarikan tidak valid."
    );

  }


  return await apiRequest(
    "withdrawCapital",
    {
      amount: amount,
      note: note
    }
  );

}


/* =========================================================
   GET REPORT
========================================================= */

async function getReport() {

  const result =
    await apiRequest(
      "getReport"
    );


  return (
    result?.data ||
    result?.report ||
    {}
  );

}


/* =========================================================
   GENERIC GET
   Berguna kalau Code.gs kamu mempunyai
   action tambahan.
========================================================= */

async function apiGet(
  action,
  data = {}
) {

  return await apiRequest(
    action,
    data
  );

}


/* =========================================================
   CONNECTION TEST
========================================================= */

async function testApiConnection() {

  try {

    const result =
      await apiRequest(
        "ping"
      );


    console.log(
      "API connection OK:",
      result
    );


    return true;


  } catch (error) {

    console.error(
      "API connection failed:",
      error
    );


    return false;

  }

}


/* =========================================================
   FORMAT ERROR
========================================================= */

function getApiErrorMessage(
  error
) {

  if (!error) {

    return "Terjadi kesalahan.";

  }


  if (
    error.message
  ) {

    return error.message;

  }


  return String(error);

}


/* =========================================================
   GLOBAL API OBJECT
   Optional
========================================================= */

window.TradingAPI = {

  request:
    apiRequest,

  getTransactions:
    getTransactions,

  addTransaction:
    addTransaction,

  deleteTransaction:
    deleteTransaction,

  getCapital:
    getCapital,

  addCapital:
    addCapital,

  withdrawCapital:
    withdrawCapital,

  getReport:
    getReport,

  test:
    testApiConnection,

  errorMessage:
    getApiErrorMessage

};
