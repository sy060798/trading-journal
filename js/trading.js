/* =========================================================
   TRADING JOURNAL
   trading.js
========================================================= */

"use strict";


/* =========================================================
   STATE
========================================================= */

let transactions = [];
let capitalData = {};

let currentTransactionId = null;


/* =========================================================
   DOM READY
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    initializeTradingPage();

  }
);


/* =========================================================
   INITIALIZE
========================================================= */

async function initializeTradingPage() {

  setDefaultDate();

  setupFormEvents();

  setupModalEvents();

  setupActionButtons();

  await loadTradingData();

}


/* =========================================================
   DEFAULT DATE
========================================================= */

function setDefaultDate() {

  const dateInput =
    document.getElementById("tanggal");

  if (!dateInput) {
    return;
  }


  const today =
    new Date();


  const year =
    today.getFullYear();


  const month =
    String(
      today.getMonth() + 1
    ).padStart(2, "0");


  const day =
    String(
      today.getDate()
    ).padStart(2, "0");


  dateInput.value =
    `${year}-${month}-${day}`;

}


/* =========================================================
   FORM EVENTS
========================================================= */

function setupFormEvents() {

  const form =
    document.getElementById(
      "transactionForm"
    );


  if (!form) {
    return;
  }


  form.addEventListener(
    "submit",
    handleTransactionSubmit
  );


  /*
   * Jika tombol reset tersedia
   */

  const resetButton =
    document.getElementById(
      "resetFormButton"
    );


  if (resetButton) {

    resetButton.addEventListener(
      "click",
      resetTransactionForm
    );

  }

}


/* =========================================================
   ACTION BUTTONS
========================================================= */

function setupActionButtons() {

  const addCapitalButton =
    document.getElementById(
      "addCapitalButton"
    );


  if (addCapitalButton) {

    addCapitalButton.addEventListener(
      "click",
      () => openCapitalModal("add")
    );

  }


  const withdrawButton =
    document.getElementById(
      "withdrawCapitalButton"
    );


  if (withdrawButton) {

    withdrawButton.addEventListener(
      "click",
      () => openCapitalModal("withdraw")
    );

  }


  const refreshButton =
    document.getElementById(
      "refreshButton"
    );


  if (refreshButton) {

    refreshButton.addEventListener(
      "click",
      loadTradingData
    );

  }

}


/* =========================================================
   LOAD DATA
========================================================= */

async function loadTradingData() {

  showGlobalLoading(
    true,
    "Memuat data trading..."
  );


  try {

    const [
      transactionResult,
      capitalResult
    ] = await Promise.all([
      getTransactions(),
      getCapital()
    ]);


    transactions =
      Array.isArray(
        transactionResult
      )
        ? transactionResult
        : [];


    capitalData =
      capitalResult || {};


    updateCapitalDisplay();

    renderTransactions();

    updateTransactionCount();


  } catch (error) {

    console.error(
      "Load trading data error:",
      error
    );


    showToast(
      "Gagal",
      getApiErrorMessage(error),
      "error"
    );


  } finally {

    showGlobalLoading(
      false
    );

  }

}


/* =========================================================
   SUBMIT TRANSACTION
========================================================= */

async function handleTransactionSubmit(
  event
) {

  event.preventDefault();


  const form =
    event.currentTarget;


  const formData =
    new FormData(form);


  const transaction =
    collectTransactionData(
      formData
    );


  const validation =
    validateTransaction(
      transaction
    );


  if (!validation.valid) {

    showToast(
      "Data belum lengkap",
      validation.message,
      "error"
    );

    return;

  }


  showGlobalLoading(
    true,
    "Menyimpan transaksi..."
  );


  try {

    await addTransaction(
      transaction
    );


    showToast(
      "Berhasil",
      "Transaksi berhasil disimpan.",
      "success"
    );


    resetTransactionForm();


    await loadTradingData();


  } catch (error) {

    console.error(
      "Add transaction error:",
      error
    );


    showToast(
      "Gagal menyimpan",
      getApiErrorMessage(error),
      "error"
    );


  } finally {

    showGlobalLoading(
      false
    );

  }

}


/* =========================================================
   COLLECT FORM
========================================================= */

function collectTransactionData(
  formData
) {

  const tanggal =
    formData.get("tanggal") ||
    getValue("tanggal");


  const saham =
    formData.get("saham") ||
    getValue("saham");


  const aksi =
    formData.get("aksi") ||
    getValue("aksi");


  const harga =
    formData.get("harga") ||
    getValue("harga");


  const lot =
    formData.get("lot") ||
    getValue("lot");


  const hasil =
    formData.get("hasil") ||
    getValue("hasil");


  const nominal =
    formData.get("nominal") ||
    getValue("nominal");


  const catatan =
    formData.get("catatan") ||
    getValue("catatan");


  return {

    tanggal:
      tanggal,

    saham:
      String(saham)
        .trim()
        .toUpperCase(),

    aksi:
      String(aksi)
        .trim()
        .toUpperCase(),

    harga:
      parseNumber(harga),

    lot:
      parseNumber(lot),

    hasil:
      normalizeResult(hasil),

    nominal:
      parseNumber(nominal),

    catatan:
      String(catatan || "")
        .trim()

  };

}


/* =========================================================
   VALIDATION
========================================================= */

function validateTransaction(
  transaction
) {

  if (!transaction.tanggal) {

    return {
      valid: false,
      message: "Tanggal wajib diisi."
    };

  }


  if (!transaction.saham) {

    return {
      valid: false,
      message: "Kode saham wajib diisi."
    };

  }


  if (!transaction.aksi) {

    return {
      valid: false,
      message: "Aksi transaksi wajib dipilih."
    };

  }


  if (
    !Number.isFinite(
      transaction.harga
    ) ||
    transaction.harga <= 0
  ) {

    return {
      valid: false,
      message: "Harga harus lebih dari 0."
    };

  }


  if (
    !Number.isFinite(
      transaction.lot
    ) ||
    transaction.lot <= 0
  ) {

    return {
      valid: false,
      message: "Lot harus lebih dari 0."
    };

  }


  /*
   * Hasil dan nominal boleh kosong.
   * Jadi transaksi BUY tidak wajib
   * mempunyai profit/loss.
   */

  if (
    transaction.nominal !== 0 &&
    !Number.isFinite(
      transaction.nominal
    )
  ) {

    return {
      valid: false,
      message: "Nominal profit/rugi tidak valid."
    };

  }


  return {
    valid: true
  };

}


/* =========================================================
   RESET FORM
========================================================= */

function resetTransactionForm() {

  const form =
    document.getElementById(
      "transactionForm"
    );


  if (form) {

    form.reset();

  }


  setDefaultDate();


  const aksi =
    document.getElementById(
      "aksi"
    );


  if (aksi) {

    aksi.value =
      "BUY";

  }


  currentTransactionId =
    null;

}


/* =========================================================
   RENDER TRANSACTIONS
========================================================= */

function renderTransactions() {

  const tbody =
    document.getElementById(
      "transactionTableBody"
    );


  if (!tbody) {
    return;
  }


  tbody.innerHTML = "";


  if (
    !transactions ||
    transactions.length === 0
  ) {

    showElement(
      "transactionEmpty",
      true
    );


    showElement(
      "transactionTableWrapper",
      false
    );


    return;

  }


  showElement(
    "transactionEmpty",
    false
  );


  showElement(
    "transactionTableWrapper",
    true
  );


  /*
   * Transaksi terbaru di atas.
   */

  const sorted =
    [...transactions].sort(
      sortTransactions
    );


  sorted.forEach(
    transaction => {

      const row =
        document.createElement(
          "tr"
        );


      const tanggal =
        formatDate(
          transaction.tanggal
        );


      const saham =
        escapeHtml(
          transaction.saham || "-"
        );


      const aksi =
        String(
          transaction.aksi || "-"
        ).toUpperCase();


      const harga =
        formatRupiah(
          transaction.harga
        );


      const lot =
        formatNumber(
          transaction.lot
        );


      const hasil =
        normalizeResult(
          transaction.hasil
        );


      const nominal =
        Number(
          transaction.nominal
        ) || 0;


      const catatan =
        escapeHtml(
          transaction.catatan || "-"
        );


      row.innerHTML = `

        <td>
          ${tanggal}
        </td>

        <td>
          <strong>
            ${saham}
          </strong>
        </td>

        <td>
          <span class="badge ${getActionClass(aksi)}">
            ${escapeHtml(aksi)}
          </span>
        </td>

        <td>
          ${harga}
        </td>

        <td>
          ${lot}
        </td>

        <td>
          ${
            hasil
              ? `
                <span class="badge ${getResultClass(hasil)}">
                  ${escapeHtml(hasil)}
                </span>
              `
              : `
                <span class="text-muted">
                  -
                </span>
              `
          }
        </td>

        <td class="${getAmountClass(nominal)}">
          ${
            nominal
              ? formatSignedRupiah(nominal)
              : "-"
          }
        </td>

        <td
          title="${catatan}"
          class="text-muted"
        >
          ${catatan}
        </td>

      `;


      tbody.appendChild(
        row
      );

    }
  );

}


/* =========================================================
   SORT TRANSACTIONS
========================================================= */

function sortTransactions(
  a,
  b
) {

  const dateA =
    new Date(
      a.tanggal || 0
    ).getTime();


  const dateB =
    new Date(
      b.tanggal || 0
    ).getTime();


  if (
    dateA !== dateB
  ) {

    return dateB - dateA;

  }


  return 0;

}


/* =========================================================
   UPDATE TRANSACTION COUNT
========================================================= */

function updateTransactionCount() {

  const element =
    document.getElementById(
      "transactionCount"
    );


  if (!element) {
    return;
  }


  element.textContent =
    formatNumber(
      transactions.length
    );

}


/* =========================================================
   UPDATE CAPITAL
========================================================= */

function updateCapitalDisplay() {

  /*
   * Mendukung beberapa nama field
   * supaya fleksibel terhadap Code.gs.
   */

  const initial =
    getCapitalValue(
      [
        "modalAwal",
        "modal_awal",
        "initialCapital",
        "initial",
        "modal"
      ]
    );


  const added =
    getCapitalValue(
      [
        "tambahModal",
        "tambah_modal",
        "addedCapital",
        "added"
      ]
    );


  const withdrawn =
    getCapitalValue(
      [
        "tarikModal",
        "tarik_modal",
        "withdrawnCapital",
        "withdrawn"
      ]
    );


  const current =
    getCapitalValue(
      [
        "modalSekarang",
        "modal_sekarang",
        "currentCapital",
        "current",
        "saldo"
      ]
    );


  /*
   * Jika backend tidak memberikan
   * current secara langsung,
   * hitung otomatis.
   */

  const calculatedCurrent =
    current !== null
      ? current
      : initial + added - withdrawn;


  setText(
    "modalAwal",
    formatRupiah(initial)
  );


  setText(
    "tambahModal",
    formatRupiah(added)
  );


  setText(
    "tarikModal",
    formatRupiah(withdrawn)
  );


  setText(
    "modalSekarang",
    formatRupiah(calculatedCurrent)
  );


  /*
   * Beberapa kemungkinan ID
   * untuk kartu modal di index.
   */

  setText(
    "currentCapital",
    formatRupiah(calculatedCurrent)
  );


  setText(
    "capitalValue",
    formatRupiah(calculatedCurrent)
  );

}


/* =========================================================
   CAPITAL MODAL EVENTS
========================================================= */

function setupModalEvents() {

  const closeButtons =
    document.querySelectorAll(
      "[data-close-modal]"
    );


  closeButtons.forEach(
    button => {

      button.addEventListener(
        "click",
        closeCapitalModal
      );

    }
  );


  const overlay =
    document.getElementById(
      "capitalModal"
    );


  if (overlay) {

    overlay.addEventListener(
      "click",
      event => {

        if (
          event.target === overlay
        ) {

          closeCapitalModal();

        }

      }
    );

  }


  const form =
    document.getElementById(
      "capitalForm"
    );


  if (form) {

    form.addEventListener(
      "submit",
      handleCapitalSubmit
    );

  }


  document.addEventListener(
    "keydown",
    event => {

      if (
        event.key === "Escape"
      ) {

        closeCapitalModal();

      }

    }
  );

}


/* =========================================================
   OPEN CAPITAL MODAL
========================================================= */

function openCapitalModal(
  type
) {

  const modal =
    document.getElementById(
      "capitalModal"
    );


  if (!modal) {

    console.warn(
      "Element #capitalModal tidak ditemukan."
    );

    return;

  }


  const title =
    document.getElementById(
      "capitalModalTitle"
    );


  const description =
    document.getElementById(
      "capitalModalDescription"
    );


  const amountInput =
    document.getElementById(
      "capitalAmount"
    );


  const typeInput =
    document.getElementById(
      "capitalType"
    );


  if (typeInput) {

    typeInput.value =
      type;

  }


  if (title) {

    title.textContent =
      type === "add"
        ? "Tambah Modal"
        : "Tarik Modal";

  }


  if (description) {

    description.textContent =
      type === "add"
        ? "Masukkan nominal modal yang ingin ditambahkan."
        : "Masukkan nominal modal yang ingin ditarik.";

  }


  if (amountInput) {

    amountInput.value = "";

    setTimeout(
      () => amountInput.focus(),
      100
    );

  }


  modal.classList.remove(
    "hidden"
  );

  modal.setAttribute(
    "aria-hidden",
    "false"
  );

  document.body.style.overflow =
    "hidden";

}


/* =========================================================
   CLOSE CAPITAL MODAL
========================================================= */

function closeCapitalModal() {

  const modal =
    document.getElementById(
      "capitalModal"
    );


  if (!modal) {
    return;
  }


  modal.classList.add(
    "hidden"
  );

  modal.setAttribute(
    "aria-hidden",
    "true"
  );

  document.body.style.overflow =
    "";

}


/* =========================================================
   CAPITAL SUBMIT
========================================================= */

async function handleCapitalSubmit(
  event
) {

  event.preventDefault();


  const typeInput =
    document.getElementById(
      "capitalType"
    );


  const amountInput =
    document.getElementById(
      "capitalAmount"
    );


  const noteInput =
    document.getElementById(
      "capitalNote"
    );


  const type =
    typeInput?.value ||
    "add";


  const amount =
    parseNumber(
      amountInput?.value
    );


  const note =
    noteInput?.value?.trim() ||
    "";


  if (
    !Number.isFinite(amount) ||
    amount <= 0
  ) {

    showToast(
      "Nominal tidak valid",
      "Masukkan nominal yang lebih dari 0.",
      "error"
    );

    return;

  }


  /*
   * Saat tarik modal,
   * cek modal tersedia jika datanya ada.
   */

  if (
    type === "withdraw"
  ) {

    const currentCapital =
      getCapitalValue(
        [
          "modalSekarang",
          "modal_sekarang",
          "currentCapital",
          "current",
          "saldo"
        ]
      );


    if (
      currentCapital !== null &&
      amount > currentCapital
    ) {

      showToast(
        "Tidak bisa menarik",
        "Nominal penarikan melebihi modal saat ini.",
        "error"
      );

      return;

    }

  }


  showGlobalLoading(
    true,
    type === "add"
      ? "Menambahkan modal..."
      : "Memproses penarikan..."
  );


  try {

    if (
      type === "add"
    ) {

      await addCapital(
        amount,
        note
      );

    } else {

      await withdrawCapital(
        amount,
        note
      );

    }


    closeCapitalModal();


    showToast(
      "Berhasil",
      type === "add"
        ? "Modal berhasil ditambahkan."
        : "Modal berhasil ditarik.",
      "success"
    );


    await loadTradingData();


  } catch (error) {

    console.error(
      "Capital error:",
      error
    );


    showToast(
      "Gagal",
      getApiErrorMessage(error),
      "error"
    );


  } finally {

    showGlobalLoading(
      false
    );

  }

}


/* =========================================================
   CAPITAL VALUE HELPER
========================================================= */

function getCapitalValue(
  keys
) {

  for (
    const key of keys
  ) {

    if (
      capitalData &&
      capitalData[key] !== undefined &&
      capitalData[key] !== null &&
      capitalData[key] !== ""
    ) {

      const value =
        Number(
          capitalData[key]
        );


      if (
        Number.isFinite(value)
      ) {

        return value;

      }

    }

  }


  return 0;

}


/* =========================================================
   NORMALIZE RESULT
========================================================= */

function normalizeResult(
  value
) {

  if (
    value === null ||
    value === undefined
  ) {

    return "";

  }


  const result =
    String(value)
      .trim()
      .toUpperCase();


  if (
    result === "PROFIT" ||
    result === "WIN" ||
    result === "UNTUNG"
  ) {

    return "PROFIT";

  }


  if (
    result === "RUGI" ||
    result === "LOSS" ||
    result === "LOSE"
  ) {

    return "RUGI";

  }


  return result;

}


/* =========================================================
   ACTION CLASS
========================================================= */

function getActionClass(
  action
) {

  const value =
    String(action)
      .toUpperCase();


  if (
    value === "BUY"
  ) {

    return "badge-buy";

  }


  if (
    value === "SELL"
  ) {

    return "badge-sell";

  }


  return "";

}


/* =========================================================
   RESULT CLASS
========================================================= */

function getResultClass(
  result
) {

  if (
    result === "PROFIT"
  ) {

    return "badge-profit";

  }


  if (
    result === "RUGI"
  ) {

    return "badge-loss";

  }


  return "";

}


/* =========================================================
   AMOUNT CLASS
========================================================= */

function getAmountClass(
  amount
) {

  amount =
    Number(amount) || 0;


  if (
    amount > 0
  ) {

    return "text-profit";

  }


  if (
    amount < 0
  ) {

    return "text-loss";

  }


  return "text-muted";

}


/* =========================================================
   FORMAT RUPIAH
========================================================= */

function formatRupiah(
  value
) {

  const number =
    Number(value) || 0;


  return new Intl.NumberFormat(
    "id-ID",
    {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }
  ).format(number);

}


/* =========================================================
   FORMAT SIGNED RUPIAH
========================================================= */

function formatSignedRupiah(
  value
) {

  const number =
    Number(value) || 0;


  if (
    number > 0
  ) {

    return "+" +
      formatRupiah(number);

  }


  if (
    number < 0
  ) {

    return "-" +
      formatRupiah(
        Math.abs(number)
      );

  }


  return formatRupiah(0);

}


/* =========================================================
   FORMAT NUMBER
========================================================= */

function formatNumber(
  value
) {

  return new Intl.NumberFormat(
    "id-ID"
  ).format(
    Number(value) || 0
  );

}


/* =========================================================
   FORMAT DATE
========================================================= */

function formatDate(
  value
) {

  if (!value) {
    return "-";
  }


  const date =
    new Date(value);


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    /*
     * Jika Apps Script mengirim
     * format DD/MM/YYYY.
     */

    const parts =
      String(value).split("/");


    if (
      parts.length === 3
    ) {

      return value;

    }


    return String(value);

  }


  return new Intl.DateTimeFormat(
    "id-ID",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    }
  ).format(date);

}


/* =========================================================
   PARSE NUMBER
========================================================= */

function parseNumber(
  value
) {

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {

    return 0;

  }


  if (
    typeof value === "number"
  ) {

    return value;

  }


  let stringValue =
    String(value)
      .trim();


  /*
   * Hilangkan Rp dan spasi
   */

  stringValue =
    stringValue
      .replace(
        /Rp/gi,
        ""
      )
      .replace(
        /\s/g,
        ""
      );


  /*
   * Format Indonesia:
   * 8.200
   * 10.000.000
   */

  if (
    stringValue.includes(".") &&
    !stringValue.includes(",")
  ) {

    stringValue =
      stringValue.replace(
        /\./g,
        ""
      );

  }


  /*
   * Format decimal:
   * 8200,5
   */

  stringValue =
    stringValue.replace(
      /,/g,
      "."
    );


  const result =
    Number(stringValue);


  return Number.isFinite(result)
    ? result
    : 0;

}


/* =========================================================
   GET INPUT VALUE
========================================================= */

function getValue(
  id
) {

  const element =
    document.getElementById(id);


  return element
    ? element.value
    : "";

}


/* =========================================================
   SET TEXT
========================================================= */

function setText(
  id,
  value
) {

  const element =
    document.getElementById(id);


  if (element) {

    element.textContent =
      value;

  }

}


/* =========================================================
   SHOW / HIDE ELEMENT
========================================================= */

function showElement(
  id,
  show
) {

  const element =
    document.getElementById(id);


  if (!element) {
    return;
  }


  if (show) {

    element.classList.remove(
      "hidden"
    );

  } else {

    element.classList.add(
      "hidden"
    );

  }

}


/* =========================================================
   GLOBAL LOADING
========================================================= */

function showGlobalLoading(
  show,
  message = "Memuat..."
) {

  const loading =
    document.getElementById(
      "globalLoading"
    );


  const text =
    document.getElementById(
      "globalLoadingText"
    );


  if (!loading) {
    return;
  }


  if (text) {

    text.textContent =
      message;

  }


  if (show) {

    loading.classList.remove(
      "hidden"
    );

  } else {

    loading.classList.add(
      "hidden"
    );

  }

}


/* =========================================================
   TOAST
========================================================= */

let toastTimer = null;


function showToast(
  title,
  message,
  type = "success"
) {

  const toast =
    document.getElementById(
      "toast"
    );


  if (!toast) {

    return;

  }


  const icon =
    document.getElementById(
      "toastIcon"
    );


  const titleElement =
    document.getElementById(
      "toastTitle"
    );


  const messageElement =
    document.getElementById(
      "toastMessage"
    );


  if (titleElement) {

    titleElement.textContent =
      title;

  }


  if (messageElement) {

    messageElement.textContent =
      message;

  }


  if (icon) {

    icon.textContent =
      type === "error"
        ? "!"
        : "✓";


    icon.style.background =
      type === "error"
        ? "rgba(239,68,68,.12)"
        : "rgba(34,197,94,.12)";


    icon.style.color =
      type === "error"
        ? "#f87171"
        : "#4ade80";

  }


  toast.classList.remove(
    "hidden"
  );


  clearTimeout(
    toastTimer
  );


  toastTimer =
    setTimeout(
      () => {

        toast.classList.add(
          "hidden"
        );

      },
      3500
    );

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(
  value
) {

  return String(value)
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );

}


/* =========================================================
   EXPOSE FUNCTIONS
========================================================= */

window.TradingPage = {

  reload:
    loadTradingData,

  resetForm:
    resetTransactionForm,

  openCapital:
    openCapitalModal,

  closeCapital:
    closeCapitalModal,

  showToast:
    showToast

};
