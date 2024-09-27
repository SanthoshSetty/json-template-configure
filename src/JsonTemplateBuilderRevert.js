import React, { useState, useCallback, useEffect } from 'react';

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
      const children = parsedSchema.schema.properties.children || [];

      const newElements = children.map(child => {
        const type = child.properties.tag.enum[0];
        const description = child.description || '';
        let content = child.properties.content?.enum?.[0] || '';
        let isDynamic = false;
        let listItemDescription = '';

        if (['ul', 'ol'].includes(type) && Array.isArray(child.properties.children)) {
          const firstChild = child.properties.children[0];
          if (firstChild.type === 'array') {
            isDynamic = true;
            listItemDescription = firstChild.description || '';
          } else {
            content = child.properties.children.map(li => ({ content: li.properties.content?.enum?.[0] || '', description: li.description || '' }));
          }
        }

        return { id: Date.now() + Math.random(), type, content, description, isDynamic, listItemDescription, hasDescription: !!description };
      });

      setElements(newElements);
    } catch {
      console.error('Invalid JSON Schema');
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
        if (action === 'add') el.content.push({ content: 'New item', description: '' });
        else if (action === 'remove') el.content.splice(index, 1);
        else if (action === 'update') el.content[index][field] = value;
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
    <div key={element.id} className="mb-4 p-4 border rounded bg-gray-50" draggable onDragStart={() => handleDragStart(index)} onDragOver={e => { e.preventDefault(); handleDragOver(index); }} onDrop={handleDrop}>
      <strong className="block mb-2">{element.type.toUpperCase()}:</strong>
      {['ul', 'ol'].includes(element.type) ? (
        <>
          <label className="block mb-2 text-xs">
            <input type="checkbox" checked={element.isDynamic} onChange={e => updateElement(element.id, { isDynamic: e.target.checked })} />
            <span className="ml-2">Dynamic List</span>
          </label>
          {element.isDynamic ? (
            <>
              <textarea value={element.description} onChange={e => updateElement(element.id, { description: e.target.value })} placeholder="List Description" className="w-full text-xs p-1 mt-1 min-h-[50px]" />
              <textarea value={element.listItemDescription} onChange={e => updateElement(element.id, { listItemDescription: e.target.value })} placeholder="Item Description" className="w-full text-xs p-1 mt-1 min-h-[50px]" />
            </>
          ) : (
            <>
              {element.content.map((item, idx) => (
                <div key={idx} className="mb-2">
                  {!item.description ? (
                    <input value={item.content} onChange={e => modifyListItem(element.id, idx, 'update', 'content', e.target.value)} className="w-full text-xs p-1 mb-1" />
                  ) : (
                    <small className="text-gray-500">Content won't be used since a description is provided.</small>
                  )}
                  <input value={item.description} onChange={e => modifyListItem(element.id, idx, 'update', 'description', e.target.value)} className="w-full text-xs p-1" placeholder="Item description" />
                  <button onClick={() => insertVariable(element.id, idx)} className="text-blue-500 text-xs mt-1">Insert Variable</button>
                </div>
              ))}
              <button onClick={() => modifyListItem(element.id, null, 'add')} className="text-blue-500 text-xs mr-2">Add Item</button>
              <button onClick={() => modifyListItem(element.id, element.content.length - 1, 'remove')} className="text-blue-500 text-xs">Remove Last Item</button>
            </>
          )}
        </>
      ) : (
        <>
          {!element.hasDescription ? (
            <input value={element.content} onChange={e => updateElement(element.id, { content: e.target.value })} className="w-full text-xs p-1 mb-1" />
          ) : (
            <small className="text-gray-500">Content won't be used since a description is provided.</small>
          )}
        </>
      )}
      {element.hasDescription ? (
        <>
          <textarea value={element.description} onChange={e => updateElement(element.id, { description: e.target.value })} placeholder="Description/Instructions for AI" className="w-full text-xs p-1 mt-1 min-h-[50px]" />
          {!['ul', 'ol'].includes(element.type) && (
            <button onClick={() => updateElement(element.id, { hasDescription: false, description: '' })} className="text-blue-500 text-xs mt-1">Remove Description</button>
          )}
        </>
      ) : (
        <button onClick={() => updateElement(element.id, { hasDescription: true })} className="text-blue-500 text-xs">Add Description</button>
      )}
      <div className="mt-2">
        <button onClick={() => insertVariable(element.id)} className="text-blue-500 text-xs mr-2">Insert Variable</button>
        <button onClick={() => setElements(prev => prev.filter(el => el.id !== element.id))} className="text-blue-500 text-xs">Remove Element</button>
      </div>
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
              return { description: element.description || '', properties: { ...baseProps, children: [{ type: 'array', description: element.listItemDescription || '', items: { properties: { tag: { enum: ['li'] }, children: null } } }] } };
            } else {
              const listItems = element.content.map(item => ({ description: item.description || '', properties: { tag: { enum: ['li'] }, content: item.description ? undefined : { enum: [item.content] }, children: null } }));
              return { description: element.description || '', properties: { ...baseProps, children: listItems } };
            }
          }

          const elementProps = { ...baseProps, content: element.hasDescription ? undefined : { enum: [element.content] }, children: null };
          return element.hasDescription ? { description: element.description, properties: elementProps } : { properties: elementProps };
        }),
      },
    },
  });

  const renderPreview = () => (
    <div className="p-5 bg-gray-100 rounded mb-5">
      {elements.map((element, index) => {
        if (element.isDynamic && ['ul', 'ol'].includes(element.type)) {
          return (
            <div key={index} className="mb-4">
              <p className="italic">{element.description}</p>
              <p className="italic">{element.listItemDescription}</p>
            </div>
          );
        }

        if (element.hasDescription) {
          return <p key={index} className="italic mb-4">{element.description}</p>;
        }

        switch (element.type) {
          case 'ul':
          case 'ol':
            return React.createElement(
              element.type,
              { key: index, className: 'mb-4 pl-5' },
              element.content.map((item, idx) => (
                <li key={idx} className="mb-1">
                  {item.description ? <p className="italic text-gray-500">{item.description}</p> : item.content}
                </li>
              ))
            );
          case 'div':
            return <div key={index} className={`h-[${element.content}] bg-gray-300 mb-4`}>Spacer: {element.content}</div>;
          case 'h1':
          case 'h2':
          case 'h3':
            return React.createElement(element.type, { key: index, className: `text-${element.type === 'h1' ? '4xl' : element.type === 'h2' ? '3xl' : '2xl'} mb-2 font-bold` }, element.content);
          default:
            return <p key={index} className="mb-4">{element.content}</p>;
        }
      })}
    </div>
  );

  return (
    <div className="font-sans p-5 bg-gray-100">
      <div className="flex mb-5">
        <div className="w-64 p-5 bg-white shadow-md mr-5">
          <h2 className="text-xl text-gray-800 border-b-2 border-blue-500 pb-2 mb-4">Add Elements</h2>
          {Object.entries(ElementTypes).map(([key, value]) => (
            <button key={key} onClick={() => addElement(value)} className="block w-full mb-2 text-left text-blue-500 hover:text-blue-700">Add {key.replace(/_/g, ' ')}</button>
          ))}
        </div>
        <div className="flex-1 p-5 bg-white shadow-md">
          <h2 className="text-xl text-gray-800 border-b-2 border-blue-500 pb-2 mb-4">Template Builder</h2>
          {elements.map((element, index) => renderElement(element, index))}
          <h2 className="text-xl text-gray-800 border-b-2 border-blue-500 pb-2 mt-8 mb-4">Human-Readable Preview</h2>
          {renderPreview()}
          <h2 className="text-xl text-gray-800 border-b-2 border-blue-500 pb-2 mt-8 mb-4">JSON Schema</h2>
          <textarea value={jsonSchema} onChange={e => setJsonSchema(e.target.value)} className="w-full h-[500px] mt-5 p-2 font-mono text-xs" />
          <button onClick={updateElementsFromSchema} className="bg-blue-500 text-white px-4 py-2 rounded mt-4 hover:bg-blue-600">Update Template</button>
        </div>
      </div>
    </div>
  );
};

export default JsonTemplateBuilderRevert;