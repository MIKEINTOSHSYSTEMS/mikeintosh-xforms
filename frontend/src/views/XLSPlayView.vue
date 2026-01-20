<template>
  <div class="xlsplay-container">
    <el-config-provider>
      <div class="App">
        <!-- Preview Error Snackbar -->
        <v-snackbar v-model="previewSnackbar" multi-line vertical location="bottom" timeout="-1">
          {{ previewText }}
          <template v-slot:actions>
            <v-btn color="red" variant="text" @click="previewSnackbar = false"> Close </v-btn>
          </template>
        </v-snackbar>

        <!-- Main Split Layout -->
        <div class="main-split-container">
          <!-- Left Pane - Spreadsheet Editor -->
          <div class="pane left-pane" ref="leftPane">
            <div class="pane-header">
              <div class="header-content">
                <div class="title-section">
                  <h2 class="pane-title">XLSForm Editor</h2>
                  <p class="pane-subtitle" v-if="!spreadsheet.data.survey">
                    Load an XLSForm to start editing
                  </p>
                  <div v-else class="form-info">
                    <span class="current-sheet">{{ sheetName }}</span>
                    <span class="form-stats">
                      {{ getSheetStats(sheetName) }}
                    </span>
                  </div>
                </div>
                
                <div class="action-buttons">
                  <el-button-group class="button-group">
                    <el-button @click="showFileModal = true" type="primary" plain class="action-btn">
                      <el-icon class="el-icon--left"><Upload /></el-icon>
                      Load File
                    </el-button>
                    
                    <el-button 
                      v-if="spreadsheet.data.survey"
                      @click="handleFileDownload" 
                      type="primary" 
                      plain 
                      class="action-btn"
                    >
                      <el-icon class="el-icon--left"><Download /></el-icon>
                      Download
                    </el-button>
                    
                    <el-button 
                      v-if="spreadsheet.data.survey"
                      type="primary" 
                      @click="handleFilePreview" 
                      :loading="isPreviewLoading" 
                      class="action-btn preview-btn"
                    >
                      <el-icon class="el-icon--left"><View /></el-icon>
                      Preview Form
                    </el-button>
                  </el-button-group>
                </div>
              </div>

              <!-- Sheet Tabs -->
              <v-tabs v-model="sheetName" v-if="spreadsheet.data.survey" class="sheet-tabs">
                <v-tab 
                  v-for="(sheet, index) in Object.keys(spreadsheet.data)" 
                  :key="index"
                  class="sheet-tab"
                >
                  <el-icon class="tab-icon">
                    <component :is="getTabIcon(sheet)" />
                  </el-icon>
                  {{ sheet }}
                </v-tab>
              </v-tabs>
            </div>

            <div class="pane-content">
              <!-- Introduction Text -->
              <div v-if="!spreadsheet.data.survey" class="intro-section">
                <div class="intro-card">
                  <el-icon class="intro-icon"><Document /></el-icon>
                  <h3>Welcome to XLSPlay!</h3>
                  <p>Start by loading an XLSForm to edit your survey, choices, and settings.</p>
                  <el-button @click="showFileModal = true" type="primary" size="large">
                    <el-icon class="el-icon--left"><Upload /></el-icon>
                    Load XLSForm
                  </el-button>
                </div>
              </div>

              <!-- HotTable Components -->
              <div v-else class="hot-table-container">
                <v-window v-model="sheetName">
                  <v-window-item 
                    v-for="(sheet, index) in Object.keys(spreadsheet.data)" 
                    :key="`${sheet}_${index}`"
                  >
                    <SurveyHotTable v-if="sheet === 'survey'" />
                    <ChoicesHotTable v-if="sheet === 'choices'" />
                    <DefaultHotTable v-if="sheet !== 'survey' && sheet !== 'choices'" :sheetName="sheet" />
                  </v-window-item>
                </v-window>
              </div>
            </div>
          </div>

          <!-- Vertical Resizer -->
          <div 
            class="vertical-resizer" 
            @mousedown="startResize"
            :class="{ 'resizing': isResizing }"
            v-if="showPreview"
          >
            <div class="resizer-handle">
              <div class="resizer-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>

          <!-- Right Pane - Form Preview -->
          <div class="pane right-pane" :class="{ 'collapsed': !showPreview }">
            <div class="pane-header">
              <div class="header-content">
                <div class="title-section">
                  <h2 class="pane-title">
                    <el-icon class="title-icon"><View /></el-icon>
                    Form Preview
                  </h2>
                  <div v-if="formName" class="form-info">
                    <span class="form-name">{{ formName }}</span>
                    <span v-if="version" class="form-version">v{{ version }}</span>
                  </div>
                  <p v-else class="pane-subtitle">
                    Preview will appear here after conversion
                  </p>
                </div>
                
                <div class="action-buttons">
                  <el-button 
                    v-if="showPreview" 
                    @click="togglePreview" 
                    type="info" 
                    plain 
                    size="small"
                  >
                    <el-icon><Close /></el-icon>
                    Hide Preview
                  </el-button>
                </div>
              </div>
            </div>

            <div class="pane-content">
              <div v-if="showPreview" class="preview-container">
                <div v-if="!xmlDefinition" class="preview-placeholder">
                  <el-icon class="placeholder-icon"><Loading v-if="isPreviewLoading" /></el-icon>
                  <p v-if="!isPreviewLoading">Click "Preview Form" to generate preview</p>
                  <p v-if="isPreviewLoading">Generating preview...</p>
                </div>
                
                <div v-else class="form-preview-wrapper">
                  <OdkWebForm
                    :form-xml="xmlDefinition"
                    :fetch-form-attachment="fetchFormAttachment"
                    mode="preview"
                    class="odk-web-form"
                  />
                </div>
              </div>
              
              <div v-else class="preview-placeholder">
                <el-icon class="placeholder-icon"><View /></el-icon>
                <p>Preview is currently hidden</p>
                <el-button @click="togglePreview" type="primary" size="small">
                  Show Preview
                </el-button>
              </div>
            </div>
          </div>
        </div>

        <!-- Bottom Pane - XML Editor -->
        <div class="xml-editor-container" :class="{ 'expanded': xmlEditorExpanded }">
          <div class="xml-editor-header" @click="toggleXmlEditor">
            <div class="header-left">
              <el-icon class="editor-icon">
                <component :is="xmlEditorExpanded ? 'ArrowDown' : 'ArrowUp'" />
              </el-icon>
              <h3 class="editor-title">XML Definition</h3>
              <el-tag v-if="xmlDefinition" type="success" size="small">
                {{ formatXmlSize(xmlDefinition) }}
              </el-tag>
            </div>
            
            <div class="header-right">
              <el-button-group>
                <el-button 
                  @click.stop="copyXml" 
                  size="small" 
                  :disabled="!xmlDefinition"
                  title="Copy XML"
                >
                  <el-icon><CopyDocument /></el-icon>
                </el-button>
                <el-button 
                  @click.stop="downloadXml" 
                  size="small" 
                  :disabled="!xmlDefinition"
                  title="Download XML"
                >
                  <el-icon><Download /></el-icon>
                </el-button>
                <el-button 
                  @click.stop="toggleXmlEditor" 
                  size="small"
                  :title="xmlEditorExpanded ? 'Collapse Editor' : 'Expand Editor'"
                >
                  <el-icon>
                    <component :is="xmlEditorExpanded ? 'Minus' : 'Plus'" />
                  </el-icon>
                </el-button>
              </el-button-group>
            </div>
          </div>
          
          <div class="xml-editor-content" v-if="xmlEditorExpanded">
            <div class="editor-toolbar">
              <div class="toolbar-left">
                <span class="editor-mode">{{ isEditingXml ? 'Editing' : 'Viewing' }}</span>
                <el-button 
                  @click="toggleEditMode" 
                  size="small" 
                  :type="isEditingXml ? 'warning' : 'primary'"
                  plain
                >
                  <el-icon>
                    <component :is="isEditingXml ? 'View' : 'Edit'" />
                  </el-icon>
                  {{ isEditingXml ? 'View Mode' : 'Edit Mode' }}
                </el-button>
                <el-button 
                  v-if="isEditingXml" 
                  @click="updateXml" 
                  type="success" 
                  size="small"
                  :disabled="!isXmlModified"
                >
                  <el-icon><Check /></el-icon>
                  Apply Changes
                </el-button>
              </div>
              
              <div class="toolbar-right">
                <el-input
                  v-model="xmlSearch"
                  placeholder="Search in XML..."
                  size="small"
                  clearable
                  style="width: 200px;"
                  @keyup.enter="highlightSearch"
                >
                  <template #prefix>
                    <el-icon><Search /></el-icon>
                  </template>
                </el-input>
              </div>
            </div>
            
            <div class="editor-wrapper">
              <div 
                v-if="!isEditingXml" 
                class="xml-viewer"
                ref="xmlViewer"
                v-html="highlightedXml"
              ></div>
              
              <textarea
                v-else
                v-model="editableXml"
                class="xml-textarea"
                ref="xmlTextarea"
                spellcheck="false"
                @input="onXmlEdit"
              ></textarea>
            </div>
            
            <div class="editor-status-bar">
              <div class="status-left">
                <span v-if="xmlDefinition">
                  Lines: {{ xmlLineCount }} | Length: {{ xmlDefinition.length }} chars
                </span>
              </div>
              <div class="status-right">
                <span v-if="isXmlModified" class="modified-indicator">
                  <el-icon><Warning /></el-icon>
                  Unsaved changes
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- File Modal -->
        <FileModal v-if="showFileModal" @close="showFileModal = false" />
      </div>
    </el-config-provider>
  </div>
</template>

<script setup lang="ts">
import { useSpreadsheetStore } from '../spreadsheetStore';
import { ref, computed, onUnmounted, onMounted, watch, nextTick } from 'vue';
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

// Icons
import {
  Upload,
  Download,
  View,
  Close,
  CopyDocument,
  Search,
  Edit,
  Check,
  Warning,
  ArrowDown,
  ArrowUp,
  Plus,
  Minus,
  Document,
  Loading,
  DocumentAdd,
  List,
  Setting,
  Collection
} from '@element-plus/icons-vue';

registerAllModules();
registerRenderer('beginGroupRowRenderer', beginGroupRowRenderer);

const spreadsheet = useSpreadsheetStore();
const sheetName = ref('survey');
const xmlDefinition = ref<string | null>(null);
const editableXml = ref<string>('');
const formName = ref<string>('');
const version = ref<string>('');
const showPreview = ref(false);
const showFileModal = ref(false);
const xmlEditorExpanded = ref(false);
const isEditingXml = ref(false);
const isXmlModified = ref(false);
const xmlSearch = ref('');
const isPreviewLoading = ref(false);
const previewSnackbar = ref(false);
const previewText = ref('');
const isResizing = ref(false);
const originalXml = ref<string>('');
const leftPane = ref<HTMLElement | null>(null);
const xmlViewer = ref<HTMLElement | null>(null);
const xmlTextarea = ref<HTMLTextAreaElement | null>(null);

// Method to highlight XML syntax
const highlightXml = (xmlString: string): string => {
  if (!xmlString) return '';
  
  // Simple XML syntax highlighting (you can replace with a proper library if needed)
  return xmlString
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/("(?:[^"]|"")*")/g, '<span class="xml-attr-value">$1</span>')
    .replace(/(&lt;\/?)([\w:-]+)/g, '$1<span class="xml-tag">$2</span>')
    .replace(/([\w:-]+)(?=\s*=\s*")/g, '<span class="xml-attr">$1</span>')
    .replace(/&lt;!--[\s\S]*?--&gt;/g, '<span class="xml-comment">$&</span>')
    .replace(/(&lt;!\[CDATA\[)([\s\S]*?)(\]\]&gt;)/g, '$1<span class="xml-cdata">$2</span>$3');
};

// Computed properties
const highlightedXml = computed(() => {
  if (!xmlDefinition.value) return '';
  
  const xmlToHighlight = isEditingXml.value ? editableXml.value : xmlDefinition.value;
  
  if (xmlSearch.value) {
    const regex = new RegExp(`(${escapeRegExp(xmlSearch.value)})`, 'gi');
    const highlighted = highlightXml(xmlToHighlight);
    return highlighted.replace(regex, '<mark class="xml-search-highlight">$1</mark>');
  }
  
  return highlightXml(xmlToHighlight);
});

const xmlLineCount = computed(() => {
  if (!xmlDefinition.value) return 0;
  return xmlDefinition.value.split('\n').length;
});

const fetchFormAttachment = async () => new Response('', { status: 404 });

// Methods
const getTabIcon = (sheetName: string) => {
  switch (sheetName) {
    case 'survey': return DocumentAdd;
    case 'choices': return List;
    case 'settings': return Setting;
    default: return Collection;
  }
};

const getSheetStats = (sheet: string) => {
  const data = spreadsheet.data[sheet];
  if (!data) return '';
  return `${data.length} rows`;
};

const togglePreview = () => {
  showPreview.value = !showPreview.value;
  if (showPreview.value && xmlDefinition.value) {
    nextTick(() => {
      if (leftPane.value) {
        leftPane.value.style.width = '50%';
      }
    });
  }
};

const toggleXmlEditor = () => {
  xmlEditorExpanded.value = !xmlEditorExpanded.value;
  if (xmlEditorExpanded.value && xmlDefinition.value) {
    nextTick(() => {
      if (xmlViewer.value) {
        xmlViewer.value.scrollTop = 0;
      }
    });
  }
};

const toggleEditMode = () => {
  isEditingXml.value = !isEditingXml.value;
  if (isEditingXml.value) {
    editableXml.value = xmlDefinition.value || '';
    originalXml.value = xmlDefinition.value || '';
    isXmlModified.value = false;
    nextTick(() => {
      if (xmlTextarea.value) {
        xmlTextarea.value.focus();
      }
    });
  }
};

const onXmlEdit = () => {
  if (isEditingXml.value) {
    isXmlModified.value = editableXml.value !== originalXml.value;
  }
};

const updateXml = () => {
  if (!isXmlModified.value) return;
  
  xmlDefinition.value = editableXml.value;
  originalXml.value = editableXml.value;
  isXmlModified.value = false;
  
  // Show success message
  previewSnackbar.value = true;
  previewText.value = 'XML updated successfully';
  setTimeout(() => {
    previewSnackbar.value = false;
  }, 2000);
};

const copyXml = async () => {
  if (!xmlDefinition.value) return;
  
  try {
    await navigator.clipboard.writeText(xmlDefinition.value);
    previewSnackbar.value = true;
    previewText.value = 'XML copied to clipboard';
    setTimeout(() => {
      previewSnackbar.value = false;
    }, 2000);
  } catch (err) {
    previewSnackbar.value = true;
    previewText.value = 'Failed to copy XML';
  }
};

const downloadXml = () => {
  if (!xmlDefinition.value) return;
  
  const blob = new Blob([xmlDefinition.value], { type: 'application/xml' });
  saveAs(blob, `${formName.value || 'form'}.xml`);
};

const formatXmlSize = (xml: string) => {
  const kb = xml.length / 1024;
  return kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb.toFixed(1)} KB`;
};

const highlightSearch = () => {
  // Highlight is handled in computed property
};

const escapeRegExp = (string: string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const handleFilePreview = async () => {
  const fileBlob = constructSpreadsheet(spreadsheet.data);

  let formData = new FormData();
  formData.append('file', fileBlob, 'spreadsheet.xlsx');
  
  try {
    isPreviewLoading.value = true;
    
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
    originalXml.value = data.xml_definition;
    formName.value = data.form_name;
    version.value = data.version;
    showPreview.value = true;
    xmlEditorExpanded.value = true;
    
    nextTick(() => {
      if (leftPane.value) {
        leftPane.value.style.width = '50%';
      }
    });
    
  } catch (error) {
    isPreviewLoading.value = false;
    previewSnackbar.value = true;
    previewText.value = error instanceof Error ? error.message : String(error);
  }
};

const handleFileDownload = async () => {
  const fileBlob = constructSpreadsheet(spreadsheet.data);
  saveAs(fileBlob, `${formName.value || 'spreadsheet'}.xlsx`);
};

const startResize = (event: MouseEvent) => {
  isResizing.value = true;
  event.preventDefault();
  
  const startX = event.clientX;
  const startWidth = leftPane.value ? leftPane.value.offsetWidth : 0;
  
  const performResize = (moveEvent: MouseEvent) => {
    if (leftPane.value) {
      const newWidth = startWidth + (moveEvent.clientX - startX);
      const minWidth = 300; // Minimum width for left pane
      const maxWidth = window.innerWidth - 300; // Minimum width for right pane
      
      if (newWidth >= minWidth && newWidth <= maxWidth) {
        leftPane.value.style.width = `${newWidth}px`;
      }
    }
  };

  const stopResize = () => {
    isResizing.value = false;
    window.removeEventListener('mousemove', performResize);
    window.removeEventListener('mouseup', stopResize);
    document.body.classList.remove('resizing-cursor');
  };

  window.addEventListener('mousemove', performResize);
  window.addEventListener('mouseup', stopResize);
  document.body.classList.add('resizing-cursor');
};

// Watch for XML changes to reset edit state
watch(xmlDefinition, (newVal) => {
  if (newVal) {
    editableXml.value = newVal;
    originalXml.value = newVal;
    isXmlModified.value = false;
  }
});

// Cleanup on component unmount
onUnmounted(() => {
  xmlDefinition.value = null;
  formName.value = '';
  version.value = '';
  showPreview.value = false;
  previewSnackbar.value = false;
  showFileModal.value = false;
  xmlEditorExpanded.value = false;
  isEditingXml.value = false;
  document.body.classList.remove('resizing-cursor');
});

// Initialize with default pane width
onMounted(() => {
  if (leftPane.value) {
    leftPane.value.style.width = '60%';
  }
});
</script>

<style scoped>
.xlsplay-container {
  position: fixed;
  top: 50px;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #e9edff 0%, #e9f7ff 100%);
  overflow: scroll;
  padding: 0;
}

.App {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
}

/* Main Split Layout */
.main-split-container {
  display: flex;
  height: 70vh;
  min-height: 200vh;
  flex: 1;
  position: relative;
  background: #fff;
  border-radius: 12px 12px 0 0;
  margin: 1rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

/* Panes */
.pane {
  display: flex;
  flex-direction: column;
  min-width: 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.left-pane {
  width: 60%;
  border-right: 1px solid #e0e0e0;
}

.right-pane {
  flex: 1;
  background: #fafafa;
}

.right-pane.collapsed {
  display: none;
}

/* Pane Headers */
.pane-header {
  background: linear-gradient(135deg, #001234 0%, #00d5ff 100%);
  padding: 1rem 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.title-section {
  flex: 1;
  min-width: 0;
}

.pane-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: white;
}

.title-icon {
  font-size: 1.2em;
}

.pane-subtitle {
  margin: 0.25rem 0 0 0;
  font-size: 0.875rem;
  opacity: 0.9;
  color: rgba(255, 255, 255, 0.9);
}

.form-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 0.5rem;
}

.current-sheet,
.form-name {
  font-weight: 600;
  background: rgba(255, 255, 255, 0.1);
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.875rem;
}

.form-stats,
.form-version {
  font-size: 0.875rem;
  opacity: 0.8;
}

/* Action Buttons */
.action-buttons {
  flex-shrink: 0;
}

.button-group {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  transition: all 0.3s ease;
}

.action-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.preview-btn {
  background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
  border: none;
  color: white;
}

.preview-btn:hover {
  background: linear-gradient(135deg, #45a049 0%, #3d8b40 100%);
}

/* Sheet Tabs */
.sheet-tabs {
  margin-top: 1rem;
  background: transparent !important;
}

.sheet-tab {
  min-width: 120px;
  color: rgba(255, 255, 255, 0.8) !important;
  border-bottom: 2px solid transparent;
  transition: all 0.3s ease;
}

.sheet-tab:hover {
  color: white !important;
  background: rgba(255, 255, 255, 0.1);
}

.sheet-tab.v-tab--selected {
  color: white !important;
  border-bottom-color: white;
  background: rgba(255, 255, 255, 0.1);
}

.tab-icon {
  margin-right: 0.5rem;
}

/* Pane Content */
.pane-content {
  flex: 1;
  overflow: hidden;
  position: relative;
}

/* Intro Section */
.intro-section {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.intro-card {
  text-align: center;
  max-width: 400px;
  padding: 3rem 2rem;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.intro-icon {
  font-size: 4rem;
  color: #667eea;
  margin-bottom: 1rem;
}

.intro-card h3 {
  margin: 1rem 0;
  color: #2d3748;
  font-size: 1.5rem;
}

.intro-card p {
  color: #4a5568;
  margin-bottom: 2rem;
  line-height: 1.6;
}

/* HotTable Container */
.hot-table-container {
  height: 100%;
  overflow: hidden;
}

/* Preview */
.preview-container {
  height: 100%;
  overflow: hidden;
}

.preview-placeholder {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #718096;
  padding: 2rem;
  text-align: center;
}

.placeholder-icon {
  font-size: 4rem;
  color: #a0aec0;
  margin-bottom: 1rem;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.form-preview-wrapper {
  height: 100%;
  overflow-y: auto;
  padding: 1rem;
}

.odk-web-form {
  max-width: 800px;
  margin: 0 auto;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* Vertical Resizer */
.vertical-resizer {
  position: relative;
  width: 8px;
  background: linear-gradient(to bottom, #010a34, #005179);
  cursor: col-resize;
  transition: all 0.3s ease;
  flex-shrink: 0;
  z-index: 10;
}

.vertical-resizer:hover,
.vertical-resizer.resizing {
  width: 12px;
  background: linear-gradient(to bottom, #00fbff, #0044ff);
}

.resizer-handle {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.resizer-dots {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.resizer-dots span {
  display: block;
  width: 3px;
  height: 3px;
  background: white;
  border-radius: 50%;
}

/* XML Editor Container */
.xml-editor-container {
  margin: 0 1rem 1rem 1rem;
  background: white;
  border-radius: 0 0 12px 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.xml-editor-container.expanded {
  flex: 1;
  min-height: 700px;
  max-height: 100vh;
}

.xml-editor-header {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #2d3748 0%, #4a5568 100%);
  color: white;
  cursor: pointer;
  user-select: none;
  transition: all 0.3s ease;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.xml-editor-header:hover {
  background: linear-gradient(135deg, #4a5568 0%, #2d3748 100%);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.editor-icon {
  font-size: 1.2em;
  transition: transform 0.3s ease;
}

.xml-editor-container.expanded .editor-icon {
  transform: rotate(180deg);
}

.editor-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

.header-right {
  display: flex;
  gap: 0.5rem;
}

/* XML Editor Content */
.xml-editor-content {
  display: flex;
  flex-direction: column;
  height: calc(100% - 48px);
  overflow: hidden;
}

.editor-toolbar {
  padding: 0.75rem 1.5rem;
  background: #f7fafc;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.editor-mode {
  font-size: 0.875rem;
  color: #4a5568;
  font-weight: 500;
}

/* Editor Wrapper */
.editor-wrapper {
  flex: 1;
  overflow: auto;
  position: relative;
}

.xml-viewer {
  padding: 1rem 1.5rem;
  font-family: 'Fira Code', 'Consolas', 'Monaco', monospace;
  font-size: 0.875rem;
  line-height: 1.6;
  background: #282c34;
  color: #abb2bf;
  white-space: pre;
  overflow-x: auto;
  min-height: 100%;
}

.xml-textarea {
  width: 100%;
  height: 100%;
  min-height: 200px;
  padding: 1rem 1.5rem;
  font-family: 'Fira Code', 'Consolas', 'Monaco', monospace;
  font-size: 0.875rem;
  line-height: 1.6;
  background: #282c34;
  color: #abb2bf;
  border: none;
  outline: none;
  resize: none;
  white-space: pre;
  tab-size: 2;
}

.xml-textarea:focus {
  outline: 2px solid #667eea;
  outline-offset: -2px;
}

/* XML Syntax Highlighting */
.xml-viewer .xml-tag {
  color: #e06c75;
}

.xml-viewer .xml-attr {
  color: #d19a66;
}

.xml-viewer .xml-attr-value {
  color: #98c379;
}

.xml-viewer .xml-comment {
  color: #5c6370;
  font-style: italic;
}

.xml-viewer .xml-cdata {
  color: #e5c07b;
}

/* Search Highlight */
.xml-search-highlight {
  background: #ffd700;
  color: #000;
  padding: 0 2px;
  border-radius: 2px;
}

/* Editor Status Bar */
.editor-status-bar {
  padding: 0.5rem 1.5rem;
  background: #2d3748;
  color: #a0aec0;
  font-size: 0.75rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid #4a5568;
}

.modified-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #f6ad55;
  font-weight: 500;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .main-split-container {
    flex-direction: column;
    height: 60vh;
  }
  
  .left-pane {
    width: 100% !important;
    height: 50%;
  }
  
  .vertical-resizer {
    width: 100%;
    height: 8px;
    cursor: row-resize;
  }
  
  .vertical-resizer:hover,
  .vertical-resizer.resizing {
    width: 100%;
    height: 12px;
  }
  
  .resizer-handle {
    transform: translate(-50%, -50%) rotate(90deg);
  }
}

@media (max-width: 768px) {
  .App {
    margin: 0;
  }
  
  .main-split-container,
  .xml-editor-container {
    margin: 0.5rem;
    border-radius: 8px;
  }
  
  .header-content {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }
  
  .action-buttons {
    align-self: stretch;
  }
  
  .button-group {
    flex-direction: column;
  }
  
  .sheet-tabs {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
}

/* Scrollbar Styling */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #47548e 0%, #764ba2 100%);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
}

/* Body Cursor during Resize */
.resizing-cursor {
  cursor: col-resize !important;
  user-select: none !important;
}

@media (max-width: 1024px) {
  .resizing-cursor {
    cursor: row-resize !important;
  }
}

/* Hide ODK Form Footer */
:deep(.odk-form .footer) {
  display: none !important;
}

:deep(.odk-form .form-header) {
  display: none !important;
}

:deep(.odk-form) {
  background-color: transparent !important;
  padding: 1rem !important;
}

/* Animation for pane transitions */
.pane-enter-active,
.pane-leave-active {
  transition: all 0.3s ease;
}

.pane-enter-from,
.pane-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
</style>