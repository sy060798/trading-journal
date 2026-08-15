/* =========================================================
   TRADING JOURNAL
   trading.js
   VERSION: FINAL - PART 1
========================================================= */

"use strict";


/* =========================================================
   STATE
========================================================= */

let transactions = [];
let capitalData = {};
let summaryData = {};

let currentTransactionId = null;

let isLoadingTradingData = false;


/* =========================================================
   DOM READY
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  function () {

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

  setupProfitLossEvents();

  await loadTradingData();

}


/* =========================================================
   DEFAULT DATE
========================================================= */

function setDefaultDate() {

  const inputs = [

    "tanggal",
    "addModalTanggal",
    "withdrawModalTanggal"

  ];


  const today =
    getTodayDate();


  inputs.forEach(function (id) {

    const input =
      document.getElementById(id);

    if (input && !input.value) {

      input.value =
        today;

    }

  });

}


/* =========================================================
   TODAY DATE
========================================================= */

function getTodayDate() {

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


  return `${year}-${month}-${day}`;

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

  /*
   * TAMBAH MODAL
   */

  const addModalButton =
    document.getElementById(
      "addModalButton"
    );


  if (addModalButton) {

    addModalButton.addEventListener(
      "click",
      function () {

        openCapitalModal("add");

      }
    );

  }


  /*
   * TARIK MODAL
   */

  const withdrawModalButton =
    document.getElementById(
      "withdrawModalButton"
    );


  if (withdrawModalButton) {

    withdrawModalButton.addEventListener(
      "click",
      function () {

        openCapitalModal("withdraw");

      }
    );

  }


  /*
   * REFRESH
   * Tetap kompatibel jika nanti
   * tombol refresh ditambahkan.
   */

  const refreshButton =
    document.getElementById(
      "refreshButton"
    );


  if (refreshButton) {

    refreshButton.addEventListener(
      "click",
      function () {

        loadTradingData();

      }
    );

  }

}


/* =========================================================
   PROFIT / LOSS EVENTS
========================================================= */

function setupProfitLossEvents() {

  const select =
    document.getElementById(
      "profitRugi"
    );


  const nominal =
    document.getElementById(
      "nominal"
    );


  const nominalGroup =
    document.getElementById(
      "nominalGroup"
    );


  if (!select || !nominal) {
    return;
  }


  function updateNominalState() {

    const value =
      select.value;


    const active =
      value === "PROFIT" ||
      value === "RUGI";


    nominal.disabled =
      !active;


    nominal.required =
      active;


    if (nominalGroup) {

      nominalGroup.classList.toggle(
        "disabled",
        !active
      );

    }


    if (!active) {

      nominal.value = "";

    }

  }


  select.addEventListener(
    "change",
    updateNominalState
  );


  updateNominalState();

}


/* =========================================================
   LOAD ALL DATA
========================================================= */

async function loadTradingData() {

  if (isLoadingTradingData) {
    return;
  }


  isLoadingTradingData = true;


  showGlobalLoading(
    true,
    "Memuat data trading..."
  );


  try {

    let result;


    /*
     * API utama
     */

    if (
      window.TradingAPI &&
      typeof window.TradingAPI.getAllData === "function"
    ) {

      result =
        await window.TradingAPI.getAllData();

    }


    /*
     * Fallback API request
     */

    else if (
      window.TradingAPI &&
      typeof window.TradingAPI.request === "function"
    ) {

      const response =
        await window.TradingAPI.request(
          "getAllData"
        );


      result =
        response?.data ||
        response ||
        {};

    }


    else {

      throw new Error(
        "TradingAPI belum tersedia. Pastikan api.js dimuat sebelum trading.js."
      );

    }


    /*
     * Normalisasi response.
     */

    if (
      result &&
      result.data &&
      !result.transaksi
    ) {

      result =
        result.data;

    }


    /*
     * TRANSAKSI
     */

    transactions =
      Array.isArray(
        result?.transaksi
      )
        ? result.transaksi
        : [];


    /*
     * SUMMARY
     */

    summaryData =
      result?.summary ||
      {};


    capitalData =
      summaryData;


    /*
     * UPDATE UI
     */

    updateCapitalDisplay();

    renderTransactions();

    updateTransactionCount();


  } catch (error) {

    console.error(
      "Load trading data error:",
      error
    );


    transactions =
      Array.isArray(transactions)
        ? transactions
        : [];


    showToast(
      "Gagal memuat data",
      getApiErrorMessage(error),
      "error"
    );


  } finally {

    isLoadingTradingData = false;


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

    if (
      !window.TradingAPI ||
      typeof window.TradingAPI.addTransaction !== "function"
    ) {

      throw new Error(
        "Fungsi addTransaction tidak tersedia di api.js."
      );

    }


    await window.TradingAPI.addTransaction(
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
   COLLECT TRANSACTION DATA
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
    formData.get("profitRugi") ||
    getValue("hasil") ||
    getValue("profitRugi");


  const nominal =
    formData.get("nominal") ||
    getValue("nominal");


  const catatan =
    formData.get("catatan") ||
    getValue("catatan");


  return {

    tanggal:
      String(
        tanggal || ""
      ).trim(),


    saham:
      String(
        saham || ""
      )
      .trim()
      .toUpperCase(),


    aksi:
      String(
        aksi || ""
      )
      .trim()
      .toUpperCase(),


    harga:
      parseNumber(harga),


    lot:
      parseNumber(lot),


    profitRugi:
      normalizeResult(hasil),


    nominal:
      parseNumber(nominal),


    catatan:
      String(
        catatan || ""
      ).trim()

  };

}


/* =========================================================
   VALIDATE TRANSACTION
========================================================= */

function validateTransaction(
  transaction
) {

  if (!transaction.tanggal) {

    return {

      valid: false,

      message:
        "Tanggal wajib diisi."

    };

  }


  if (!transaction.saham) {

    return {

      valid: false,

      message:
        "Kode saham wajib diisi."

    };

  }


  if (
    !["BUY", "SELL"].includes(
      transaction.aksi
    )
  ) {

    return {

      valid: false,

      message:
        "Aksi harus BUY atau SELL."

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

      message:
        "Harga harus lebih dari 0."

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

      message:
        "Lot harus lebih dari 0."

    };

  }


  if (
    transaction.profitRugi &&
    ![
      "PROFIT",
      "RUGI"
    ].includes(
      transaction.profitRugi
    )
  ) {

    return {

      valid: false,

      message:
        "Hasil harus PROFIT atau RUGI."

    };

  }


  if (
    transaction.profitRugi &&
    (
      !Number.isFinite(
        transaction.nominal
      ) ||
      transaction.nominal <= 0
    )
  ) {

    return {

      valid: false,

      message:
        "Nominal profit/rugi wajib diisi."

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


  const profitRugi =
    document.getElementById(
      "profitRugi"
    );


  if (profitRugi) {

    profitRugi.value =
      "";

  }


  setupProfitLossEvents();


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
    !Array.isArray(transactions) ||
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


  const sorted =
    [...transactions]
      .sort(sortTransactions);


  sorted.forEach(
    function (transaction) {

      const row =
        document.createElement(
          "tr"
        );


      const tanggal =
        formatDate(
          transaction.Tanggal ??
          transaction.tanggal
        );


      const saham =
        escapeHtml(
          transaction.Saham ??
          transaction.saham ??
          "-"
        );


      const aksi =
        String(
          transaction.Aksi ??
          transaction.aksi ??
          "-"
        )
        .toUpperCase();


      const harga =
        parseNumber(
          transaction.Harga ??
          transaction.harga
        );


      const lot =
        parseNumber(
          transaction.Lot ??
          transaction.lot
        );


      const hasil =
        normalizeResult(
          transaction["Profit/Rugi"] ??
          transaction.profitRugi ??
          transaction.hasil
        );


      const nominal =
        parseNumber(
          transaction.Nominal ??
          transaction.nominal
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
          ${formatRupiah(harga)}
        </td>

        <td>
          ${formatNumber(lot)}
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

        <td class="${getAmountClassByResult(hasil)}">
          ${
            nominal > 0
              ? formatRupiah(nominal)
              : "-"
          }
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
    parseDateValue(
      a.Tanggal ??
      a.tanggal
    );


  const dateB =
    parseDateValue(
      b.Tanggal ??
      b.tanggal
    );


  return dateB - dateA;

}


/* =========================================================
   TRANSACTION COUNT
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
   CAPITAL DISPLAY
========================================================= */

function updateCapitalDisplay() {

  const modalAwal =
    getSummaryNumber(
      "modalAwal"
    );


  const totalTambah =
    getSummaryNumber(
      "totalTambah"
    );


  const totalTarik =
    getSummaryNumber(
      "totalTarik"
    );


  let modal =
    getSummaryNumber(
      "modal"
    );


  /*
   * Fallback perhitungan modal.
   */

  if (
    modal === 0 &&
    (
      modalAwal !== 0 ||
      totalTambah !== 0 ||
      totalTarik !== 0
    )
  ) {

    modal =
      modalAwal +
      totalTambah -
      totalTarik;

  }


  const totalProfit =
    getSummaryNumber(
      "totalProfit"
    );


  const totalRugi =
    getSummaryNumber(
      "totalRugi"
    );


  const netProfit =
    getSummaryNumber(
      "netProfit"
    );


  const total =
    getSummaryNumber(
      "total"
    );


  capitalData = {

    modalAwal:
      modalAwal,

    totalTambah:
      totalTambah,

    totalTarik:
      totalTarik,

    modal:
      modal,

    totalProfit:
      totalProfit,

    totalRugi:
      totalRugi,

    netProfit:
      netProfit,

    total:
      total

  };


  /*
   * ID untuk halaman laporan
   * jika nanti digunakan.
   */

  setText(
    "modalAwal",
    formatRupiah(modalAwal)
  );


  setText(
    "tambahModal",
    formatRupiah(totalTambah)
  );


  setText(
    "tarikModal",
    formatRupiah(totalTarik)
  );


  setText(
    "modalSekarang",
    formatRupiah(modal)
  );


  setText(
    "currentCapital",
    formatRupiah(modal)
  );


  setText(
    "capitalValue",
    formatRupiah(modal)
  );


  setText(
    "totalProfit",
    formatRupiah(totalProfit)
  );


  setText(
    "totalRugi",
    formatRupiah(totalRugi)
  );


  setText(
    "netProfit",
    formatSignedRupiah(netProfit)
  );


  setText(
    "totalCapital",
    formatRupiah(total)
  );


  /*
   * ID SESUAI index.html
   */

  setText(
    "modalValue",
    formatRupiah(modal)
  );


  setText(
    "profitLossValue",
    formatSignedRupiah(netProfit)
  );


  setText(
    "totalValue",
    formatRupiah(
      modal + netProfit
    )
  );


  /*
   * Warna profit / loss.
   */

  const profitElement =
    document.getElementById(
      "profitLossValue"
    );


  if (profitElement) {

    profitElement.classList.remove(
      "text-profit",
      "text-loss"
    );


    if (netProfit > 0) {

      profitElement.classList.add(
        "text-profit"
      );

    }


    if (netProfit < 0) {

      profitElement.classList.add(
        "text-loss"
      );

    }

  }

}


/* =========================================================
   SUMMARY NUMBER
========================================================= */

function getSummaryNumber(
  key
) {

  const value =
    summaryData?.[key];


  const number =
    Number(value);


  if (
    Number.isFinite(number)
  ) {

    return number;

  }


  return 0;

}

/* =========================================================
   CAPITAL MODAL EVENTS
========================================================= */

function setupModalEvents() {

  /*
   * Tombol tutup semua modal
   */

  const closeButtons =
    document.querySelectorAll(
      "[data-close-modal]"
    );


  closeButtons.forEach(
    function (button) {

      button.addEventListener(
        "click",
        closeCapitalModal
      );

    }
  );


  /*
   * Overlay ADD MODAL
   */

  const addModal =
    document.getElementById(
      "addModal"
    );


  if (addModal) {

    addModal.addEventListener(
      "click",
      function (event) {

        if (
          event.target === addModal
        ) {

          closeCapitalModal();

        }

      }
    );

  }


  /*
   * Overlay WITHDRAW MODAL
   */

  const withdrawModal =
    document.getElementById(
      "withdrawModal"
    );


  if (withdrawModal) {

    withdrawModal.addEventListener(
      "click",
      function (event) {

        if (
          event.target === withdrawModal
        ) {

          closeCapitalModal();

        }

      }
    );

  }


  /*
   * FORM TAMBAH MODAL
   */

  const addForm =
    document.getElementById(
      "addModalForm"
    );


  if (addForm) {

    addForm.addEventListener(
      "submit",
      handleAddModalSubmit
    );

  }


  /*
   * FORM TARIK MODAL
   */

  const withdrawForm =
    document.getElementById(
      "withdrawModalForm"
    );


  if (withdrawForm) {

    withdrawForm.addEventListener(
      "submit",
      handleWithdrawModalSubmit
    );

  }


  /*
   * ESCAPE
   */

  document.addEventListener(
    "keydown",
    function (event) {

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

  /*
   * Tutup modal terlebih dahulu.
   */

  closeCapitalModal();


  const modalId =
    type === "add"
      ? "addModal"
      : "withdrawModal";


  const modal =
    document.getElementById(
      modalId
    );


  if (!modal) {

    console.warn(
      "Modal tidak ditemukan:",
      modalId
    );

    return;

  }


  /*
   * Tentukan ID input.
   */

  const dateId =
    type === "add"
      ? "addModalTanggal"
      : "withdrawModalTanggal";


  const amountId =
    type === "add"
      ? "addModalNominal"
      : "withdrawModalNominal";


  const noteId =
    type === "add"
      ? "addModalCatatan"
      : "withdrawModalCatatan";


  const dateInput =
    document.getElementById(
      dateId
    );


  const amountInput =
    document.getElementById(
      amountId
    );


  const noteInput =
    document.getElementById(
      noteId
    );


  /*
   * Reset input.
   */

  if (dateInput) {

    dateInput.value =
      getTodayDate();

  }


  if (amountInput) {

    amountInput.value = "";

  }


  if (noteInput) {

    noteInput.value = "";

  }


  /*
   * Tampilkan modal.
   */

  modal.classList.remove(
    "hidden"
  );


  modal.setAttribute(
    "aria-hidden",
    "false"
  );


  document.body.style.overflow =
    "hidden";


  /*
   * Fokus nominal.
   */

  setTimeout(
    function () {

      if (amountInput) {

        amountInput.focus();

      }

    },
    100
  );

}


/* =========================================================
   CLOSE CAPITAL MODAL
========================================================= */

function closeCapitalModal() {

  const modalIds = [

    "addModal",

    "withdrawModal"

  ];


  modalIds.forEach(
    function (id) {

      const modal =
        document.getElementById(
          id
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

    }
  );


  document.body.style.overflow =
    "";

}


/* =========================================================
   ADD CAPITAL
========================================================= */

async function handleAddModalSubmit(
  event
) {

  event.preventDefault();


  const tanggal =
    document.getElementById(
      "addModalTanggal"
    )?.value ||
    "";


  const nominal =
    parseNumber(
      document.getElementById(
        "addModalNominal"
      )?.value
    );


  const catatan =
    document.getElementById(
      "addModalCatatan"
    )?.value?.trim() ||
    "";


  /*
   * VALIDASI TANGGAL
   */

  if (!tanggal) {

    showToast(
      "Data belum lengkap",
      "Tanggal wajib diisi.",
      "error"
    );

    return;

  }


  /*
   * VALIDASI NOMINAL
   */

  if (
    !Number.isFinite(nominal) ||
    nominal <= 0
  ) {

    showToast(
      "Nominal tidak valid",
      "Masukkan nominal lebih dari 0.",
      "error"
    );

    return;

  }


  /*
   * CEK API
   */

  if (
    !window.TradingAPI ||
    typeof window.TradingAPI.addCapital !== "function"
  ) {

    showToast(
      "API tidak tersedia",
      "Fungsi addCapital belum tersedia di api.js.",
      "error"
    );

    return;

  }


  showGlobalLoading(
    true,
    "Menambahkan modal..."
  );


  try {

    /*
     * Kirim data.
     *
     * Parameter dibuat kompatibel
     * dengan API lama.
     */

    await window.TradingAPI.addCapital(
      nominal,
      catatan,
      tanggal
    );


    /*
     * Tutup modal.
     */

    closeCapitalModal();


    /*
     * Notifikasi.
     */

    showToast(
      "Berhasil",
      "Modal berhasil ditambahkan.",
      "success"
    );


    /*
     * Refresh semua data.
     */

    await loadTradingData();


  } catch (error) {

    console.error(
      "Add capital error:",
      error
    );


    showToast(
      "Gagal menambah modal",
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
   WITHDRAW CAPITAL
========================================================= */

async function handleWithdrawModalSubmit(
  event
) {

  event.preventDefault();


  const tanggal =
    document.getElementById(
      "withdrawModalTanggal"
    )?.value ||
    "";


  const nominal =
    parseNumber(
      document.getElementById(
        "withdrawModalNominal"
      )?.value
    );


  const catatan =
    document.getElementById(
      "withdrawModalCatatan"
    )?.value?.trim() ||
    "";


  /*
   * VALIDASI TANGGAL
   */

  if (!tanggal) {

    showToast(
      "Data belum lengkap",
      "Tanggal wajib diisi.",
      "error"
    );

    return;

  }


  /*
   * VALIDASI NOMINAL
   */

  if (
    !Number.isFinite(nominal) ||
    nominal <= 0
  ) {

    showToast(
      "Nominal tidak valid",
      "Masukkan nominal lebih dari 0.",
      "error"
    );

    return;

  }


  /*
   * MODAL TERSEDIA
   */

  const currentCapital =
    getSummaryNumber(
      "modal"
    );


  if (
    nominal > currentCapital
  ) {

    showToast(
      "Penarikan ditolak",
      "Nominal penarikan melebihi modal yang tersedia.",
      "error"
    );

    return;

  }


  /*
   * CEK API
   */

  if (
    !window.TradingAPI ||
    typeof window.TradingAPI.withdrawCapital !== "function"
  ) {

    showToast(
      "API tidak tersedia",
      "Fungsi withdrawCapital belum tersedia di api.js.",
      "error"
    );

    return;

  }


  showGlobalLoading(
    true,
    "Memproses penarikan..."
  );


  try {

    await window.TradingAPI.withdrawCapital(
      nominal,
      catatan,
      tanggal
    );


    closeCapitalModal();


    showToast(
      "Berhasil",
      "Modal berhasil ditarik.",
      "success"
    );


    await loadTradingData();


  } catch (error) {

    console.error(
      "Withdraw capital error:",
      error
    );


    showToast(
      "Gagal menarik modal",
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
    String(
      action || ""
    ).toUpperCase();


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

function getAmountClassByResult(
  result
) {

  if (
    result === "PROFIT"
  ) {

    return "text-profit";

  }


  if (
    result === "RUGI"
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


  const stringValue =
    String(value);


  /*
   * YYYY-MM-DD
   */

  if (
    /^\d{4}-\d{2}-\d{2}$/.test(
      stringValue
    )
  ) {

    const parts =
      stringValue.split("-");


    return (
      parts[2] +
      "/" +
      parts[1] +
      "/" +
      parts[0]
    );

  }


  /*
   * DD/MM/YYYY
   */

  if (
    /^\d{2}\/\d{2}\/\d{4}$/.test(
      stringValue
    )
  ) {

    return stringValue;

  }


  const date =
    new Date(value);


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return stringValue;

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
   PARSE DATE
========================================================= */

function parseDateValue(
  value
) {

  if (!value) {
    return 0;
  }


  const stringValue =
    String(value);


  /*
   * YYYY-MM-DD
   */

  if (
    /^\d{4}-\d{2}-\d{2}$/.test(
      stringValue
    )
  ) {

    return new Date(
      stringValue +
      "T00:00:00"
    ).getTime();

  }


  /*
   * DD/MM/YYYY
   */

  const parts =
    stringValue.split("/");


  if (
    parts.length === 3 &&
    parts[0].length === 2 &&
    parts[1].length === 2 &&
    parts[2].length === 4
  ) {

    return new Date(
      Number(parts[2]),
      Number(parts[1]) - 1,
      Number(parts[0])
    ).getTime();

  }


  const date =
    new Date(value);


  return Number.isNaN(
    date.getTime()
  )
    ? 0
    : date.getTime();

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

    return Number.isFinite(value)
      ? value
      : 0;

  }


  let stringValue =
    String(value)
      .trim();


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
   *
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
   * Format desimal:
   *
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
   GET VALUE
========================================================= */

function getValue(
  id
) {

  const element =
    document.getElementById(
      id
    );


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
    document.getElementById(
      id
    );


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
    document.getElementById(
      id
    );


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


  /*
   * Jika toast tidak ada,
   * tetap tampilkan di console.
   */

  if (!toast) {

    if (
      type === "error"
    ) {

      console.error(
        title + ":",
        message
      );

    } else {

      console.log(
        title + ":",
        message
      );

    }

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
      function () {

        toast.classList.add(
          "hidden"
        );

      },
      3500
    );

}


/* =========================================================
   API ERROR MESSAGE
========================================================= */

function getApiErrorMessage(
  error
) {

  if (!error) {

    return "Terjadi kesalahan.";

  }


  if (
    typeof error === "string"
  ) {

    return error;

  }


  if (
    error.message
  ) {

    return error.message;

  }


  if (
    error.error
  ) {

    return String(
      error.error
    );

  }


  return String(error);

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
   EXPOSE TRADING PAGE
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
