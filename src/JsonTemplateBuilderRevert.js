import React, { useState, useCallback, useEffect } from 'react';
import { PlusIcon, MinusIcon, TrashIcon, VariableIcon } from '@heroicons/react/solid';

const ElementTypes = { HEADING1: 'h1', HEADING2: 'h2', HEADING3: 'h3', PARAGRAPH: 'p', UNORDERED_LIST: 'ul', ORDERED_LIST: 'ol', SPAN: 'span', STRONG: 'strong', SPACER: 'div' };
const defaultContent = { ul: [{ content: 'List item 1', description: '' }], ol: [{ content: 'List item 1', description: '' }], div: '50px', strong: 'Insert dynamic product name', span: 'Insert span content' };

const JsonTemplateBuilderRevert = () => {
  const [elements, setElements] = useState([]);
  const [draggingIndex, setDraggingIndex] = useState(null);
  const [jsonSchema, setJsonSchema] = useState(JSON.stringify({ schema: { properties: { tag: { enum: ['body'] }, children: [] } } }, null, 2));

  useEffect(() => {
    setJsonSchema(JSON.stringify(convertToJsonSchema(), null, 2));
  }, [elements]);

  const updateElementsFromSchema = () => {
    try {
      const parsedSchema = JSON.parse(jsonSchema);
      const newElements = parsedSchema.schema.properties.children.map((child, index) => {
        const type = child.properties.tag.enum[0];
        let content;
        if (['ul', 'ol'].includes(type)) {
          content = child.properties.children.map(item => ({
            content: item.properties.content?.enum[0] || '',
            description: item.description || '',
            nestedSpans: item.properties.children?.map(span => ({
              content: span.properties.content?.enum[0] || '',
              description: span.description || ''
            })) || []
          }));
        } else {
          content = child.properties.content?.enum[0] || defaultContent[type] || '';
        }
        return {
          id: Date.now() + index,
          type,
          content,
          description: child.description || '',
          isDynamic: child.properties.children?.[0]?.type === 'array',
          hasDescription: !!child.description
        };
      });
      setElements(newElements);
    } catch (error) {
      console.error('Error parsing JSON schema:', error);
    }
  };

  const addElement = useCallback(type => {
    setElements(prev => [...prev, { id: Date.now(), type, content: defaultContent[type] || 'New element', description: '', isDynamic: false, listItemDescription: '', hasDescription: false }]);
  }, []);

  const updateElement = useCallback((id, updates) => {
    setElements(prev => prev.map(el => {
      if (el.id === id) {
        const updatedElement = { ...el, ...updates };
        if ('description' in updates && updates.description.trim() === '') updatedElement.hasDescription = false;
        return updatedElement;
      }
      return el;
    }));
  }, []);

  const modifyListItem = useCallback((id, index, action, field, value) => {
    setElements(prev => prev.map(el => {
      if (el.id === id) {
        const newContent = [...el.content];
        if (action === 'add') {
          newContent.push({ content: '', description: '', nestedSpans: [] });
        } else if (action === 'remove') {
          newContent.splice(index, 1);
        } else if (action === 'update') {
          newContent[index][field] = value;
        } else if (action === 'removeContent') {
          newContent[index].content = '';
        }
        return { ...el, content: newContent };
      }
      return el;
    }));
  }, []);

  const addNestedSpan = useCallback((id, itemIndex) => {
    setElements(prev => prev.map(el => {
      if (el.id === id) {
        const newContent = [...el.content];
        if (!newContent[itemIndex].nestedSpans) {
          newContent[itemIndex].nestedSpans = [];
        }
        // Clear content and description when adding the first nested span
        if (newContent[itemIndex].nestedSpans.length === 0) {
          newContent[itemIndex].content = '';
          newContent[itemIndex].description = '';
        }
        newContent[itemIndex].nestedSpans.push({ content: '', description: '' });
        return { ...el, content: newContent };
      }
      return el;
    }));
  }, []);

  const updateNestedSpan = useCallback((id, itemIndex, spanIndex, field, value) => {
    setElements(prev => prev.map(el => {
      if (el.id === id) {
        const newContent = [...el.content];
        newContent[itemIndex].nestedSpans[spanIndex][field] = value;
        return { ...el, content: newContent };
      }
      return el;
    }));
  }, []);

  const removeNestedSpan = useCallback((id, itemIndex, spanIndex) => {
    setElements(prev => prev.map(el => {
      if (el.id === id) {
        const newContent = [...el.content];
        newContent[itemIndex].nestedSpans.splice(spanIndex, 1);
        return { ...el, content: newContent };
      }
      return el;
    }));
  }, []);

  const insertVariable = useCallback((id, idx = null) => {
    setElements(prev => prev.map(el => {
      if (el.id === id) {
        if (Array.isArray(el.content) && idx !== null) el.content[idx].content += ' {{Variable Name}}';
        else if (typeof el.content === 'string') el.content += ' {{Variable Name}}';
      }
      return el;
    }));
  }, []);

  const handleDragStart = index => setDraggingIndex(index);
  const handleDragOver = index => {
    if (index !== draggingIndex) {
      setElements(prev => {
        const newElements = [...prev];
        const [movedItem] = newElements.splice(draggingIndex, 1);
        newElements.splice(index, 0, movedItem);
        return newElements;
      });
      setDraggingIndex(index);
    }
  };
  const handleDrop = () => setDraggingIndex(null);

  const renderElement = (element, index) => (
    <div key={element.id} className="mb-6 p-6 border rounded-lg bg-white shadow-sm transition-all duration-200 hover:shadow-md" draggable onDragStart={() => handleDragStart(index)} onDragOver={e => { e.preventDefault(); handleDragOver(index); }} onDrop={handleDrop}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-700">{element.type.toUpperCase()}</h3>
        <button onClick={() => setElements(prev => prev.filter(el => el.id !== element.id))} className="text-red-500 hover:text-red-700 transition-colors duration-200">
          <TrashIcon className="h-5 w-5" />
        </button>
      </div>
      {['ul', 'ol'].includes(element.type) ? (
        <>
          <label className="flex items-center mb-4 text-sm text-gray-600">
            <input type="checkbox" checked={element.isDynamic} onChange={e => updateElement(element.id, { isDynamic: e.target.checked })} className="mr-2" />
            <span>Dynamic List</span>
          </label>
          {element.isDynamic ? (
            <>
              <textarea value={element.description} onChange={e => updateElement(element.id, { description: e.target.value })} placeholder="List Description" className="w-full p-2 mb-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <textarea value={element.listItemDescription} onChange={e => updateElement(element.id, { listItemDescription: e.target.value })} placeholder="Item Description" className="w-full p-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </>
          ) : (
            <>
              {element.content.map((item, idx) => (
                <div key={idx} className="mb-4 p-4 bg-gray-50 rounded-md">
                  <div className="flex items-center mb-2">
                    <span className="mr-2 text-gray-500">{element.type === 'ul' ? '•' : `${idx + 1}.`}</span>
                    {(!item.nestedSpans || item.nestedSpans.length === 0) && (
                      <input 
                        value={item.content} 
                        onChange={e => modifyListItem(element.id, idx, 'update', 'content', e.target.value)} 
                        className="flex-grow p-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" 
                        placeholder="List item content"
                      />
                    )}
                  </div>
                  {(!item.nestedSpans || item.nestedSpans.length === 0) && (
                    <input 
                      value={item.description} 
                      onChange={e => modifyListItem(element.id, idx, 'update', 'description', e.target.value)} 
                      className="w-full p-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" 
                      placeholder="Item description" 
                    />
                  )}
                  <div className="mt-2 space-x-2">
                    {(!item.nestedSpans || item.nestedSpans.length === 0) && (
                      <>
                        <button onClick={() => modifyListItem(element.id, idx, 'removeContent')} className="text-red-500 hover:text-red-700 transition-colors duration-200">
                          Remove Content
                        </button>
                        <button onClick={() => insertVariable(element.id, idx)} className="text-blue-500 hover:text-blue-700 transition-colors duration-200">
                          <VariableIcon className="h-5 w-5 inline mr-1" />
                          Insert Variable
                        </button>
                      </>
                    )}
                    <button onClick={() => addNestedSpan(element.id, idx)} className="text-green-500 hover:text-green-700 transition-colors duration-200">
                      {item.nestedSpans && item.nestedSpans.length > 0 ? 'Add Another Nested Span' : 'Add Nested Span'}
                    </button>
                  </div>
                  {item.nestedSpans && item.nestedSpans.map((span, spanIdx) => (
                    <div key={spanIdx} className="mt-2 ml-4 p-2 bg-gray-100 rounded">
                      <input 
                        value={span.content} 
                        onChange={e => updateNestedSpan(element.id, idx, spanIdx, 'content', e.target.value)} 
                        className="p-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 w-full mb-2" 
                        placeholder="Nested span content"
                      />
                      <input 
                        value={span.description} 
                        onChange={e => updateNestedSpan(element.id, idx, spanIdx, 'description', e.target.value)} 
                        className="p-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 w-full mb-2" 
                        placeholder="Nested span description"
                      />
                      <div className="flex justify-between">
                        <button onClick={() => updateNestedSpan(element.id, idx, spanIdx, 'content', '')} className="text-red-500 hover:text-red-700 transition-colors duration-200">
                          Remove Content
                        </button>
                        <button onClick={() => removeNestedSpan(element.id, idx, spanIdx)} className="text-red-500 hover:text-red-700 transition-colors duration-200">
                          Remove Span
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
              <div className="mt-4">
                <button onClick={() => modifyListItem(element.id, null, 'add')} className="text-green-500 hover:text-green-700 transition-colors duration-200">
                  <PlusIcon className="h-5 w-5 inline mr-1" />
                  Add Item
                </button>
              </div>
            </>
          )}
        </>
      ) : (
        <>
          {!element.hasDescription ? (
            <input value={element.content} onChange={e => updateElement(element.id, { content: e.target.value })} className="w-full p-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" />
          ) : (
            <p className="text-sm text-gray-500 italic">Content won't be used since a description is provided.</p>
          )}
        </>
      )}
      {element.hasDescription ? (
        <>
          <textarea value={element.description} onChange={e => updateElement(element.id, { description: e.target.value })} placeholder="Description/Instructions for AI" className="w-full p-2 mt-4 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" />
          {!['ul', 'ol'].includes(element.type) && (
            <button onClick={() => updateElement(element.id, { hasDescription: false, description: '' })} className="mt-2 text-blue-500 hover:text-blue-700 transition-colors duration-200">Remove Description</button>
          )}
        </>
      ) : (
        <button onClick={() => updateElement(element.id, { hasDescription: true })} className="mt-2 text-blue-500 hover:text-blue-700 transition-colors duration-200">Add Description</button>
      )}
      {!['ul', 'ol'].includes(element.type) && (
        <div className="mt-4">
          <button onClick={() => insertVariable(element.id)} className="text-blue-500 hover:text-blue-700 transition-colors duration-200">
            <VariableIcon className="h-5 w-5 inline mr-1" />
            Insert Variable
          </button>
        </div>
      )}
    </div>
  );

  const convertToJsonSchema = () => ({
  schema: {
    properties: {
      tag: { enum: ['body'] },
      children: elements.map(element => {
        const baseProps = { tag: { enum: [element.type] } };

        if (['ul', 'ol'].includes(element.type)) {
          if (element.isDynamic) {
            return { 
              description: element.description || '', 
              properties: { 
                ...baseProps, 
                children: [{ 
                  type: 'array', 
                  description: element.listItemDescription || '', 
                  items: { 
                    properties: { 
                      tag: { enum: ['li'] }, 
                      children: null 
                    } 
                  } 
                }] 
              } 
            };
          } else {
            const listItems = element.content.map(item => ({
              ...(item.nestedSpans && item.nestedSpans.length > 0
                ? {
                    properties: {
                      tag: { enum: ['li'] },
                      children: item.nestedSpans.map(span => ({
                        properties: {
                          tag: { enum: ['span'] },
                          ...(span.content ? { content: { enum: [span.content] } } : {}),
                          ...(span.description ? { description: span.description } : {})
                        }
                      }))
                    }
                  }
                : {
                    description: item.description || '',
                    properties: {
                      tag: { enum: ['li'] },
                      ...(item.content ? { content: { enum: [item.content] } } : {}),
                      children: null
                    }
                  })
            }));
            return { description: element.description || '', properties: { ...baseProps, children: listItems } };
          }
        }

        const elementProps = { 
          ...baseProps, 
          content: element.hasDescription ? undefined : { enum: [element.content] }, 
          children: null 
        };
        return element.hasDescription 
          ? { description: element.description, properties: elementProps } 
          : { properties: elementProps };
      }),
    },
  },
});

  const renderPreview = () => (
  <div className="p-5 bg-gray-100 rounded mb-5 text-gray-800">
    {elements.map((element, index) => {
      if (element.isDynamic && ['ul', 'ol'].includes(element.type)) {
        return (
          <div key={index} className="mb-4 p-3 bg-yellow-100 rounded">
            <p className="font-semibold">Dynamic {element.type === 'ul' ? 'Unordered' : 'Ordered'} List:</p>
            <p className="italic">{element.description}</p>
            <p className="italic">Items: {element.listItemDescription}</p>
          </div>
        );
      }

      if (element.hasDescription) {
        return (
          <div key={index} className="mb-4 p-3 bg-green-100 rounded">
            <p className="font-semibold">{element.type.toUpperCase()}:</p>
            <p className="italic">Generated content for: {element.description}</p>
          </div>
        );
      }

      switch (element.type) {
        case 'ul':
        case 'ol':
          const ListComponent = element.type === 'ul' ? 'ul' : 'ol';
          return (
            <ListComponent key={index} className={`mb-4 pl-5 ${element.type === 'ul' ? 'list-disc' : 'list-decimal'}`}>
              {element.content.map((item, idx) => (
                <li key={idx} className="mb-2">
                  {item.nestedSpans && item.nestedSpans.length > 0 ? (
                    item.nestedSpans.map((span, spanIdx) => (
                      <React.Fragment key={spanIdx}>
                        {span.content || (span.description && <span className="italic text-gray-600">Generated content for: {span.description}</span>)}
                      </React.Fragment>
                    ))
                  ) : (
                    item.content || (item.description && <span className="italic text-gray-600">Generated content for: {item.description}</span>)
                  )}
                </li>
              ))}
            </ListComponent>
          );
        case 'div':
          return <div key={index} className="h-8 bg-gray-300 mb-4 flex items-center justify-center text-sm">Spacer: {element.content}</div>;
        case 'h1':
          return <h1 key={index} className="text-4xl font-bold mb-4">{element.content}</h1>;
        case 'h2':
          return <h2 key={index} className="text-3xl font-semibold mb-3">{element.content}</h2>;
        case 'h3':
          return <h3 key={index} className="text-2xl font-medium mb-2">{element.content}</h3>;
        case 'strong':
          return <strong key={index} className="font-bold">{element.content}</strong>;
        case 'span':
          return <span key={index}>{element.content}</span>;
        default:
          return <p key={index} className="mb-4">{element.content}</p>;
      }
    })}
  </div>
);
  return (
    <div className="font-sans p-8 bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">JSON Template Builder</h1>
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-64 bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 border-b-2 border-blue-500 pb-2 mb-4">Add Elements</h2>
            {Object.entries(ElementTypes).map(([key, value]) => (
              <button 
                key={key} 
                onClick={() => addElement(value)} 
                className="block w-full mb-2 text-left text-blue-500 hover:text-blue-700 transition-colors duration-200"
              >
                Add {key.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
          <div className="flex-1">
            <div className="bg-white shadow-md rounded-lg p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-800 border-b-2 border-blue-500 pb-2 mb-4">Template Builder</h2>
              {elements.map((element, index) => renderElement(element, index))}
            </div>
            <div className="bg-white shadow-md rounded-lg p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-800 border-b-2 border-blue-500 pb-2 mb-4">Human-Readable Preview</h2>
              {renderPreview()}
            </div>
            <div className="bg-white shadow-md rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 border-b-2 border-blue-500 pb-2 mb-4">JSON Schema</h2>
              <textarea 
                value={jsonSchema} 
                onChange={e => setJsonSchema(e.target.value)} 
                className="w-full h-[300px] p-2 font-mono text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button 
                onClick={updateElementsFromSchema} 
                className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors duration-200"
              >
                Update Template
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JsonTemplateBuilderRevert;