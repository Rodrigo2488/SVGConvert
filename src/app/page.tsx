'use client';

import React, { useState, useRef, useCallback } from 'react';
import ImageTracer from 'imagetracerjs';
import { Upload, Download, Loader2, AlertCircle } from 'lucide-react';

export default function HomePage() {
  const [svgString, setSvgString] = useState<string | null>(null);
  const [modifiedSvgString, setModifiedSvgString] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>('#3b82f6');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && (file.type === 'image/png' || file.type === 'image/jpeg' || file.type === 'image/jpg')) {
      setError(null);
      setIsLoading(true);
      setSvgString(null);
      setModifiedSvgString(null);

      const reader = new FileReader();
      reader.onload = (e) => {
        const imageDataUrl = e.target?.result as string;
        ImageTracer.imageToSVG(
          imageDataUrl,
          (svg: string) => {
            setSvgString(svg);
            applyColorToSvg(svg, selectedColor);
            setIsLoading(false);
          },
          {
            ltres: 1,
            qtres: 1,
            pathomit: 8,
            rightangleenhance: true,
          }
        );
      };
      reader.onerror = () => {
        setError('Erro ao ler o arquivo da imagem.');
        setIsLoading(false);
      };
      reader.readAsDataURL(file);
    } else {
      setError('Por favor, selecione um arquivo PNG ou JPG válido.');
      setSvgString(null);
      setModifiedSvgString(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const applyColorToSvg = useCallback((svg: string | null, color: string) => {
    if (!svg) {
      setModifiedSvgString(null);
      return;
    }
    try {
      let coloredSvg = svg
        .replace(/fill="[^"#]*"/g, `fill="${color}"`)
        .replace(/stroke="[^"#]*"/g, `stroke="${color}"`)
        .replace(/fill:[^;""]*/g, `fill:${color}`)
        .replace(/stroke:[^;""]*/g, `stroke:${color}`);

      if (!/<svg[^>]*fill=/i.test(coloredSvg)) {
        coloredSvg = coloredSvg.replace(/<svg/i, `<svg fill="${color}"`);
      }

      setModifiedSvgString(coloredSvg);
    } catch (e) {
      console.error('Error applying color:', e);
      setError('Erro ao aplicar a cor ao SVG.');
      setModifiedSvgString(svg);
    }
  }, []);

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setSelectedColor(newColor);
    applyColorToSvg(svgString, newColor);
  };

  const handleDownload = () => {
    if (!modifiedSvgString) return;
    const blob = new Blob([modifiedSvgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ícone_convertido.svg'; // nome em português
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex flex-col items-center justify-center p-4 md:p-8">
      <div className="bg-white shadow-xl rounded-lg p-6 md:p-10 w-full max-w-2xl">
        <h1 className="text-3xl md:text-4xl font-bold text-center text-blue-700 mb-2">
          Conversor de Imagem para SVG
        </h1>
        <p className="text-center text-gray-600 mb-6 md:mb-8">
          Faça upload de um ícone (PNG/JPG), converta para SVG e personalize a cor.
        </p>

        {/* File Input */}
        <div className="mb-6">
          <label
            htmlFor="file-upload"
            className="flex flex-col items-center justify-center w-full h-32 px-4 transition bg-white border-2 border-blue-300 border-dashed rounded-md cursor-pointer hover:border-blue-400"
          >
            <span className="flex items-center space-x-2">
              <Upload className="w-6 h-6 text-blue-500" />
              <span className="font-medium text-gray-600">
                Arraste e solte ou <span className="text-blue-600 underline">escolha um arquivo</span>
              </span>
            </span>
            <span className="mt-1 text-sm text-gray-500">PNG ou JPG</span>
          </label>
          <input
            id="file-upload"
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg, image/jpg"
            onChange={handleImageUpload}
            className="sr-only"
          />
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center text-blue-600 space-x-2 my-4">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Convertendo imagem...</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center justify-center text-red-600 space-x-2 my-4 bg-red-50 p-3 rounded-md border border-red-200">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {/* SVG Result */}
        {modifiedSvgString && !isLoading && (
          <div className="mt-6 md:mt-8 p-4 md:p-6 border border-gray-200 rounded-lg bg-gray-50">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">Resultado SVG</h2>
            <div className="flex flex-col md:flex-row items-center justify-around gap-6">
              <div
                className="w-48 h-48 md:w-56 md:h-56 p-4 border border-gray-300 rounded-md bg-white flex items-center justify-center overflow-hidden shadow-inner"
                dangerouslySetInnerHTML={{ __html: modifiedSvgString }}
                suppressHydrationWarning // Para evitar erros de hidratação
              />
              <div className="flex flex-col items-center space-y-4">
                <div className="flex items-center space-x-2">
                  <label htmlFor="colorPicker" className="text-sm font-medium text-gray-700">Cor:</label>
                  <input
                    type="color"
                    id="colorPicker"
                    value={selectedColor}
                    onChange={handleColorChange}
                    className="w-10 h-10 border border-gray-300 rounded-md cursor-pointer"
                  />
                </div>
                <button
                  onClick={handleDownload}
                  className="flex items-center justify-center px-4 py-2 bg-blue-500 text-white rounded-md shadow hover:bg-blue-600 transition"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Baixar SVG
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}