import React, { useState, useRef } from 'react';
import { Upload as UploadIcon, Image, FileText, AlertCircle, CheckCircle, X, ChevronDown } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { uploadScript, fetchScripts, fetchSystemConfig } from '../utils/api';
import { Script } from '../types';

const Upload: React.FC = () => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [jsonFile, setJsonFile] = useState<File | null>(null);
  const [tags, setTags] = useState('');
  const [uploaderName, setUploaderName] = useState('');
  const [version, setVersion] = useState('');
  const [baseScriptId, setBaseScriptId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [imagePreview, setImagePreview] = useState<string>('');
  const [approvedScripts, setApprovedScripts] = useState<Script[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [jsonContent, setJsonContent] = useState<any>(null);
  const [systemSettings, setSystemSettings] = useState({
    allowUserRegistration: true,
    requireScriptApproval: true,
    maxUploadSizeKB: 10240,
    maxUploadsPerDay: 10,
    maxScriptsPerUser: 50,
    allowedFileTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/json']
  });

  const imageInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);

  // Load approved scripts for version selection
  React.useEffect(() => {
    const loadScripts = async () => {
      try {
        const [scripts, config] = await Promise.all([
          fetchScripts(),
          fetchSystemConfig()
        ]);
        const approved = scripts.filter((script: Script) => script.status === 'approved');
        setApprovedScripts(approved);
        setAvailableTags(config.availableTags || []);
        setSystemSettings(config.systemSettings || systemSettings);
      } catch (error) {
        console.error('加载剧本失败:', error);
      }
    };
    loadScripts();
  }, []);

  const handleImageClick = () => {
    imageInputRef.current?.click();
  };

  const handleJsonClick = () => {
    jsonInputRef.current?.click();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setImageFile(file);
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
        setSubmitStatus('idle');
        setErrorMessage('');
      } else {
        setErrorMessage('请选择有效的图片文件');
        setSubmitStatus('error');
      }
    }
  };

  const handleJsonChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type === 'application/json' || file.name.endsWith('.json')) {
        setJsonFile(file);
        
        // 读取并解析JSON内容
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const content = JSON.parse(e.target?.result as string);
            setJsonContent(content);
          } catch (error) {
            console.error('JSON解析失败:', error);
            setJsonContent(null);
          }
        };
        reader.readAsText(file);
        
        setSubmitStatus('idle');
        setErrorMessage('');
      } else {
        setErrorMessage('请选择有效的JSON文件');
        setSubmitStatus('error');
      }
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview('');
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  const removeJson = () => {
    setJsonFile(null);
    setJsonContent(null);
    if (jsonInputRef.current) {
      jsonInputRef.current.value = '';
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      if (!imageFile || !jsonFile) {
        throw new Error('请上传图片和JSON文件');
      }

      if (!uploaderName.trim() && !user) {
        throw new Error('请输入上传者姓名');
      }

      if (!version.trim()) {
        throw new Error('请输入版本号');
      }

      // 创建FormData对象
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('tags', selectedTags.join(','));
      formData.append('uploaderName', user?.name || uploaderName.trim());
      formData.append('version', version.trim());
      formData.append('baseScriptId', baseScriptId);
      formData.append('uploaderId', user?.id || '');
      formData.append('image', imageFile);
      formData.append('json', jsonFile);

      // 上传到服务器
      const result = await uploadScript(formData);
      
      if (result.success) {
        setSubmitStatus('success');
        
        // 重新加载剧本列表
        const scripts = await fetchScripts();
        const approved = scripts.filter((script: Script) => script.status === 'approved');
        setApprovedScripts(approved);
      } else {
        throw new Error(result.error || '上传失败');
      }
      
      // Reset form
      setTitle('');
      setDescription('');
      setImageFile(null);
      setJsonFile(null);
      setSelectedTags([]);
      setUploaderName('');
      setVersion('');
      setBaseScriptId('');
      setImagePreview('');
      setJsonContent(null);
      if (imageInputRef.current) imageInputRef.current.value = '';
      if (jsonInputRef.current) jsonInputRef.current.value = '';
    } catch (error) {
      setSubmitStatus('error');
      setErrorMessage(error instanceof Error ? error.message : '上传失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white dark:text-white text-gray-900 mb-4">上传剧本</h1>
        <p className="text-gray-300 dark:text-gray-300 text-gray-600">
          {user 
            ? (user.skipReview 
                ? '您拥有免审核权限，剧本将立即发布' 
                : systemSettings.requireScriptApproval 
                  ? '上传的剧本需要管理员审核后才能发布'
                  : '剧本将自动发布到剧本库')
            : systemSettings.requireScriptApproval
              ? '游客上传的剧本需要管理员审核后才能发布'
              : '剧本将自动发布到剧本库'
          }
        </p>
        <div className="mt-2 text-sm text-gray-400 dark:text-gray-400 text-gray-500">
          <p>• 最大文件大小: {(systemSettings.maxUploadSizeKB / 1024).toFixed(1)} MB</p>
          <p>• 每日上传限制: {systemSettings.maxUploadsPerDay} 个剧本</p>
          <p>• 个人剧本总数限制: {systemSettings.maxScriptsPerUser} 个</p>
        </div>
      </div>

      {submitStatus === 'success' && (
        <div className="mb-6 bg-green-900/20 dark:bg-green-900/20 bg-green-100 border border-green-700 dark:border-green-700 border-green-300 rounded-lg p-4 flex items-center space-x-3">
          <CheckCircle className="text-green-400" size={20} />
          <p className="text-green-300 dark:text-green-300 text-green-700">
            剧本上传成功！{(user?.skipReview) ? '已发布到剧本库' : '等待管理员审核'}
          </p>
        </div>
      )}

      {submitStatus === 'error' && (
        <div className="mb-6 bg-red-900/20 dark:bg-red-900/20 bg-red-100 border border-red-700 dark:border-red-700 border-red-300 rounded-lg p-4 flex items-center space-x-3">
          <AlertCircle className="text-red-400" size={20} />
          <p className="text-red-300 dark:text-red-300 text-red-700">{errorMessage}</p>
        </div>
      )}

      <div className="bg-gray-800 dark:bg-gray-800 bg-white rounded-lg p-8 border border-transparent dark:border-transparent border-gray-200">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 dark:text-gray-300 text-gray-700 mb-2">
                  剧本标题 *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 dark:bg-gray-700 bg-white text-white dark:text-white text-gray-900 rounded-lg border border-gray-600 dark:border-gray-600 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="输入剧本标题"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 dark:text-gray-300 text-gray-700 mb-2">
                  剧本描述 *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-700 dark:bg-gray-700 bg-white text-white dark:text-white text-gray-900 rounded-lg border border-gray-600 dark:border-gray-600 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="描述剧本的背景、玩法和特色"
                  required
                />
              </div>

              {!user && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 dark:text-gray-300 text-gray-700 mb-2">
                    上传者姓名 *
                  </label>
                  <input
                    type="text"
                    value={uploaderName}
                    onChange={(e) => setUploaderName(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700 dark:bg-gray-700 bg-white text-white dark:text-white text-gray-900 rounded-lg border border-gray-600 dark:border-gray-600 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="请输入您的姓名"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  标签选择
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowTagDropdown(!showTagDropdown)}
                    className="w-full px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-between"
                  >
                    <span className="text-left">
                      {selectedTags.length > 0 ? `已选择 ${selectedTags.length} 个标签` : '选择标签'}
                    </span>
                    <ChevronDown size={20} className={`transform transition-transform ${showTagDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {showTagDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {availableTags.map(tag => (
                        <label
                          key={tag}
                          className="flex items-center px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedTags.includes(tag)}
                            onChange={() => toggleTag(tag)}
                            className="mr-3 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-gray-900 dark:text-white">{tag}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                
                {selectedTags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedTags.map(tag => (
                      <span
                        key={tag}
                        className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm flex items-center space-x-1"
                      >
                        <span>{tag}</span>
                        <button
                          type="button"
                          onClick={() => toggleTag(tag)}
                          className="hover:bg-blue-700 rounded-full p-0.5"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 dark:text-gray-300 text-gray-700 mb-2">
                  版本号 *
                </label>
                <input
                  type="text"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 dark:bg-gray-700 bg-white text-white dark:text-white text-gray-900 rounded-lg border border-gray-600 dark:border-gray-600 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="v1.0, v2.1, beta1 等"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 dark:text-gray-300 text-gray-700 mb-2">
                  关联已有剧本 (可选)
                </label>
                <select
                  value={baseScriptId}
                  onChange={(e) => setBaseScriptId(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 dark:bg-gray-700 bg-white text-white dark:text-white text-gray-900 rounded-lg border border-gray-600 dark:border-gray-600 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">创建新剧本</option>
                  {approvedScripts.map(script => (
                    <option key={script.id} value={script.baseScriptId || script.id}>
                      {script.title} ({script.version})
                    </option>
                  ))}
                </select>
                <p className="text-gray-400 dark:text-gray-400 text-gray-500 text-sm mt-1">
                  选择已有剧本可创建新版本，留空则创建全新剧本
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 dark:text-gray-300 text-gray-700 mb-2">
                  剧本封面图片 *
                </label>
                <div 
                  onClick={handleImageClick}
                  className="border-2 border-dashed border-gray-600 dark:border-gray-600 border-gray-300 rounded-lg p-6 text-center hover:border-gray-500 dark:hover:border-gray-500 hover:border-gray-400 transition-colors cursor-pointer"
                >
                  {imageFile ? (
                    <div className="space-y-4">
                      <div className="relative inline-block">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="max-w-full h-48 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeImage();
                          }}
                          className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                      <p className="text-gray-300 dark:text-gray-300 text-gray-600 text-sm">{imageFile.name}</p>
                    </div>
                  ) : (
                    <div>
                      <Image className="mx-auto mb-4 text-gray-400" size={48} />
                      <p className="text-gray-300 dark:text-gray-300 text-gray-600 mb-2">点击选择图片文件</p>
                      <p className="text-gray-500 dark:text-gray-500 text-gray-500 text-sm">支持 JPG, PNG, GIF 格式</p>
                    </div>
                  )}
                </div>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  required
                />
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 dark:text-gray-300 text-gray-700 mb-2">
                  剧本 JSON 文件 *
                </label>
                <div 
                  onClick={handleJsonClick}
                  className="border-2 border-dashed border-gray-600 dark:border-gray-600 border-gray-300 rounded-lg p-6 text-center hover:border-gray-500 dark:hover:border-gray-500 hover:border-gray-400 transition-colors cursor-pointer"
                >
                  {jsonFile ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-center space-x-3">
                        <FileText className="text-blue-400" size={32} />
                        <div className="text-left">
                          <p className="text-white dark:text-white text-gray-900 font-medium">{jsonFile.name}</p>
                          <p className="text-gray-400 dark:text-gray-400 text-gray-500 text-sm">{(jsonFile.size / 1024).toFixed(1)} KB</p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeJson();
                          }}
                          className="bg-red-600 hover:bg-red-700 text-white rounded-full p-1 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <FileText className="mx-auto mb-4 text-gray-400" size={48} />
                      <p className="text-gray-300 dark:text-gray-300 text-gray-600 mb-2">点击选择 JSON 文件</p>
                      <p className="text-gray-500 dark:text-gray-500 text-gray-500 text-sm">包含剧本数据的 JSON 格式文件</p>
                    </div>
                  )}
                </div>
                <input
                  ref={jsonInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleJsonChange}
                  className="hidden"
                  required
                />
              </div>

              {jsonContent && (
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                  <h3 className="text-gray-900 dark:text-white font-medium mb-2">JSON 文件内容预览</h3>
                  <div className="max-h-64 overflow-y-auto">
                    <pre className="text-gray-600 dark:text-gray-300 text-sm overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(jsonContent, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-gray-700 dark:border-gray-700 border-gray-200 pt-6">
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                className="px-6 py-3 text-gray-300 dark:text-gray-300 text-gray-600 hover:text-white dark:hover:text-white hover:text-gray-900 transition-colors"
                onClick={() => {
                  setTitle('');
                  setDescription('');
                  setImageFile(null);
                  setJsonFile(null);
                  setSelectedTags([]);
                  setUploaderName('');
                  setVersion('');
                  setBaseScriptId('');
                  setImagePreview('');
                  setJsonContent(null);
                  setSubmitStatus('idle');
                  setErrorMessage('');
                  if (imageInputRef.current) imageInputRef.current.value = '';
                  if (jsonInputRef.current) jsonInputRef.current.value = '';
                }}
              >
                重置
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg font-semibold transition-colors flex items-center space-x-2"
              >
                <UploadIcon size={20} />
                <span>{isSubmitting ? '上传中...' : '上传剧本'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Upload;