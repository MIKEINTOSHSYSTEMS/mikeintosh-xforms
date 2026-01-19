<template>
  <div class="xlsplay-container">
    <el-config-provider>
      <div class="App">
        <v-snackbar v-model="previewSnackbar" multi-line vertical location="bottom" timeout="-1">
          {{ previewText }}

          <template v-slot:actions>
            <v-btn color="red" variant="text" @click="previewSnackbar = false"> Close </v-btn>
          </template>
        </v-snackbar>
        <div class="split-container">
          <div class="pane" ref="leftPane">
            <div v-if="!spreadsheet.data.survey" class="intro-text">
              Welcome to XLSPlay! Start by loading an XLSForm:
            </div>
            <div class="buttons-container">
              <el-button @click="showFileModal = true" type="success" plain>
                <el-icon class="el-icon--left"><Plus /></el-icon>
                Load new file
              </el-button>
              <FileModal v-if="showFileModal" @close="showFileModal = false" />
              <div v-if="spreadsheet.data.survey" class="grid-item">
                <el-button @click="handleFileDownload" type="success" plain>
                  <el-icon class="el-icon--left"><Download /></el-icon>
                  Download
                </el-button>
              </div>
              <div v-if="spreadsheet.data.survey" class="grid-item">
                <el-button type="success" @click="handleFilePreview" :loading="isPreviewLoading">Preview</el-button>
              </div>
            </div>

            <v-tabs v-model="sheetName" v-if="spreadsheet.data.survey">
              <v-tab v-for="(sheetName, index) in Object.keys(spreadsheet.data)" :key="index">
                {{ sheetName }}
              </v-tab>
            </v-tabs>
            <v-window v-model="sheetName" v-if="spreadsheet.data.survey">
              <v-window-item v-for="(sheetName, index) in Object.keys(spreadsheet.data)" :key="`${sheetName}_${index}`">
                <SurveyHotTable v-if="sheetName === 'survey'" />
                <ChoicesHotTable v-if="sheetName === 'choices'" />
                <DefaultHotTable v-if="sheetName !== 'survey' && sheetName !== 'choices'" :sheetName="sheetName" />
              </v-window-item>
            </v-window>
          </div>
          <div class="resizer" @mousedown="startResize" v-if="showPreview"></div>
          <div class="pane preview-pane">
            <div v-if="showPreview" class="preview-content">
              <div v-if="!xmlDefinition" class="preview-placeholder">
                <p>Preview will appear here after converting XLSForm.</p>
              </div>
              <div v-else class="form-preview">
                <h3>Form Preview: {{ formName || 'Untitled Form' }}</h3>
                <p v-if="version" class="version">Version: {{ version }}</p>
                <div class="form-container">
                  <OdkWebForm
                    :form-xml="xmlDefinition"
                    :fetch-form-attachment="fetchFormAttachment"
                    mode="preview"
                  />
                </div>
              </div>
            </div>
            <div v-else class="no-preview">
              <p>Click "Preview" to convert and display the XLSForm.</p>
            </div>
          </div>
        </div>
      </div>
    </el-config-provider>
  </div>
</template>

<script setup lang="ts">
import { useSpreadsheetStore } from '../spreadsheetStore';
import { ref, onUnmounted } from 'vue';
import { registerRenderer } from 'handsontable/renderers';
import { registerAllModules } from 'handsontable/registry';
import { saveAs } from 'file-saver';
import { OdkWebForm } from '@getodk/web-forms';

import { beginGroupRowRenderer } from '../hottable_utils';
import SurveyHotTable from '../components/SurveyHotTable.vue';
import ChoicesHotTable from '../components/ChoicesHotTable.vue';
import DefaultHotTable from '../components/DefaultHotTable.vue';
import FileModal from '../components/FileModal.vue';
import { constructSpreadsheet } from '../utils';

registerAllModules();
registerRenderer('beginGroupRowRenderer', beginGroupRowRenderer);

const spreadsheet = useSpreadsheetStore();
const sheetName = ref('survey');
const xmlDefinition = ref<string | null>(null);
const formName = ref<string>('');
const version = ref<string>('');
const showPreview = ref(false);
const showFileModal = ref(false);

const isPreviewLoading = ref(false);
const previewSnackbar = ref(false);
const previewText = ref('');

const fetchFormAttachment = async () => new Response('', { status: 404 });

const handleFilePreview = async () => {
  const fileBlob = constructSpreadsheet(spreadsheet.data);

  let formData = new FormData();
  formData.append('file', fileBlob, 'spreadsheet.xlsx');
  
  try {
    isPreviewLoading.value = true;
    
    // Use the correct API endpoint for XLSPlay preview
    const response = await fetch('/api/forms/preview/', {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
      },
    });
    
    isPreviewLoading.value = false;
    previewSnackbar.value = false;

    if (response.status === 400) {
      const data = await response.json();
      previewSnackbar.value = true;
      previewText.value = data.detail || data.error || 'Validation error';
      return;
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    xmlDefinition.value = data.xml_definition;
    formName.value = data.form_name;
    version.value = data.version;
    showPreview.value = true;
    
  } catch (error) {
    isPreviewLoading.value = false;
    previewSnackbar.value = true;
    previewText.value = error instanceof Error ? error.message : String(error);
  }
};

const handleFileDownload = async () => {
  const fileBlob = constructSpreadsheet(spreadsheet.data);
  saveAs(fileBlob, 'spreadsheet.xlsx');
};

const leftPane = ref<HTMLElement | null>(null);

const startResize = (event: MouseEvent) => {
  const performResize = (moveEvent: MouseEvent) => {
    if (leftPane.value) {
      leftPane.value.style.width = `${moveEvent.clientX}px`;
    }
  };

  const stopResize = () => {
    window.removeEventListener('mousemove', performResize);
    window.removeEventListener('mouseup', stopResize);
  };

  window.addEventListener('mousemove', performResize);
  window.addEventListener('mouseup', stopResize);
};

// Cleanup on component unmount
onUnmounted(() => {
  xmlDefinition.value = null;
  formName.value = '';
  version.value = '';
  showPreview.value = false;
  previewSnackbar.value = false;
  showFileModal.value = false;
});
</script>

<style scoped>
.xlsplay-container {
  background-color: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.split-container {
  display: flex;
  height: 80vh;
  gap: 0;
}

@media (max-width: 768px) {
  .split-container {
    flex-direction: column;
    height: auto;
  }
}

.pane {
  flex: 1;
  overflow: hidden;
  min-width: 0;
}

.preview-pane {
  background-color: #f9fafb;
  border-left: 1px solid #e5e7eb;
  padding: 1rem;
  display: flex;
  flex-direction: column;
}

.preview-content {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.preview-placeholder {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  font-style: italic;
}

.no-preview {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  font-style: italic;
}

.form-preview {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.form-preview h3 {
  margin-top: 0;
  margin-bottom: 0.5rem;
  color: #111827;
  font-size: 1.25rem;
  font-weight: 600;
}

.form-preview .version {
  margin-top: 0;
  margin-bottom: 1rem;
  color: #6b7280;
  font-size: 0.875rem;
}

.form-container {
  flex: 1;
  overflow-y: auto;
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  padding: 1rem;
}

.resizer {
  cursor: ew-resize;
  width: 5px;
  background-color: #ccc;
  flex-shrink: 0;
}

.intro-text {
  margin-top: 1rem;
  color: #4b5563;
}

.buttons-container {
  display: flex;
  gap: 1rem;
  margin: 1rem 0;
  flex-wrap: wrap;
}

.grid-item {
  display: inline-block;
}

/* Hide the send button in preview mode */
:deep(.odk-form .footer) {
  display: none !important;
}

/* Style the form to look better in preview */
:deep(.odk-form) {
  background-color: transparent !important;
}

:deep(.odk-form .form-header) {
  display: none !important;
}
</style>