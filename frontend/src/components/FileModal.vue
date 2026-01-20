<template>
  <el-dialog
    v-model="dialogVisible"
    title="Load an XLSForm"
    width="500px"
    align-center
  >
    <p class="dialog-description">
      Upload your own XLSForm or choose one from our example library.
      Files must contain <strong>survey</strong>, <strong>choices</strong>,
      and <strong>settings</strong> sheets.
    </p>

    <div class="content-container">
      <!-- Upload Section -->
      <el-upload
        v-model:file-list="fileList"
        :show-file-list="false"
        :auto-upload="false"
        accept=".xlsx, .xls"
        @change="handleFileUpload"
      >
        <el-button type="success" size="large" class="action-button">
          <el-icon class="el-icon--left">
            <Upload />
          </el-icon>
          Upload XLSForm
        </el-button>
      </el-upload>

      <!-- Divider -->
      <div class="divider">
        <span>OR</span>
      </div>

      <!-- Example Selector -->
      <el-select
        v-model="selectedFile"
        class="example-select"
        placeholder="Select an example template"
        size="large"
        @change="handleSelectChange"
      >
        <el-option
          v-for="file in exampleFiles"
          :key="file"
          :label="file"
          :value="file"
        >
          <span class="option-label" :title="file">
            {{ file }}
          </span>
        </el-option>
      </el-select>
    </div>

    <template #footer>
      <el-button @click="dialogVisible = false">Close</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref } from 'vue';
import { getSheetsData } from '../utils';
import { useSpreadsheetStore } from '../spreadsheetStore';

const spreadsheet = useSpreadsheetStore();

const dialogVisible = ref(true);
const fileList = ref([]);
const selectedFile = ref(null);

const exampleFiles = [
  'starter.xlsx',
  'anc_visit.xlsx',
  'baseline_household_survey.xlsx',
  'fatal_injury_surveillance_form.xlsx',
  'household_water_survey.xlsx',
  'monthly_project_report.xlsx',
  'shelter_material_survey.xlsx',
  'spraying_survey.xlsx',
];

const handleFileUpload = async (file) => {
  if (!file?.raw) return;

  const reader = new FileReader();
  reader.onload = (evt) => {
    const bstr = evt.target.result;
    const { sheetsData, sheetColumnWidths } = getSheetsData(bstr);
    spreadsheet.setData(sheetsData);
    spreadsheet.setColWidths(sheetColumnWidths);
  };
  reader.readAsArrayBuffer(file.raw);
  dialogVisible.value = false;
};

const handleSelectChange = async (fileName) => {
  if (!fileName) return;

  try {
    const response = await fetch(`/xlsform_examples/${fileName}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.status}`);
    }

    const blob = await response.blob();
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const { sheetsData, sheetColumnWidths } = getSheetsData(bstr);
      spreadsheet.setData(sheetsData);
      spreadsheet.setColWidths(sheetColumnWidths);
    };
    reader.readAsArrayBuffer(blob);
    dialogVisible.value = false;
  } catch (error) {
    console.error('Error loading example file:', error);
    alert(`Failed to load example file: ${error.message}`);
  }
};
</script>

<style scoped>
.dialog-description {
  color: var(--el-text-color-secondary);
  font-size: 0.95rem;
  margin-bottom: 1.5rem;
  line-height: 1.5;
}

.content-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

/* Upload button */
.action-button {
  width: 100%;
  max-width: 320px;
}

/* OR divider */
.divider {
  display: flex;
  align-items: center;
  width: 100%;
  max-width: 360px;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background-color: var(--el-border-color);
}

.divider span {
  padding: 0 0.75rem;
  font-size: 0.85rem;
  color: var(--el-text-color-secondary);
}

/* Select */
.example-select {
  width: 100%;
  max-width: 360px;
}

.option-label {
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
