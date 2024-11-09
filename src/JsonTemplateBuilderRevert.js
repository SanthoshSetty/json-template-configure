import React, { useState, useCallback, useEffect } from 'react';
import { PlusIcon, TrashIcon, MenuIcon } from '@heroicons/react/solid';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { v4 as uuidv4 } from 'uuid';

const getElementTypeName = (type) => {
  const typeNames = {
    p: 'Paragraph',
    ul: 'Unordered List (Bullet Points)',
    ol: 'Ordered List (Numbered List)',
    br: 'Line Break'
  };
  return typeNames[type] || type.toUpperCase();
};

const ElementTypes = {
  PARAGRAPH: 'p',
  UNORDERED_LIST: 'ul',
  ORDERED_LIST: 'ol',
  BREAK: 'br'
};

const defaultContent = {
  ul: [{ id: uuidv4(), content: 'List item 1', description: null }],
  ol: [{ id: uuidv4(), content: 'List item 1', description: null }],
  br: '',
  p: 'Paragraph text'
};

const AddElementSidebar = ({ addElement }) => (
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
);

const ListItem = ({ item, index, elementId, modifyListItem }) => (
  <Draggable draggableId={item.id} index={index} key={item.id}>
    {(provided) => (
      <li
        className="mb-4 p-4 bg-gray-50 rounded-md flex items-start"
        ref={provided.innerRef}
        {...provided.draggableProps}
      >
        <div {...provided.dragHandleProps} className="mr-2 cursor-grab">
          <MenuIcon className="h-5 w-5 text-gray-500" />
        </div>
        <textarea
          value={item.content}
          onChange={(e) => modifyListItem(elementId, item.id, e.target.value)}
          className="flex-1 p-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
          placeholder="List item content"
        />
        <button
          onClick={() => modifyListItem(elementId, item.id, null)}
          className="p-1 text-red-500 hover:text-red-700"
        >
          <TrashIcon className="h-5 w-5" />
        </button>
      </li>
    )}
  </Draggable>
);

const Element = ({ element, index, updateElement, removeElement, modifyListItem }) => (
  <Draggable draggableId={element.id} index={index} key={element.id}>
    {(provided) => (
      <div
        className="mb-6 p-6 border rounded-lg bg-white shadow-sm transition-all duration-200 hover:shadow-md"
        ref={provided.innerRef}
        {...provided.draggableProps}
      >
        <div className="flex justify-between items-center mb-4" {...provided.dragHandleProps}>
          <h3 className="text-lg font-semibold text-gray-700">{getElementTypeName(element.type)}</h3>
          <button onClick={() => removeElement(element.id)} className="p-1 text-red-500 hover:text-red-700">
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
        {['ul', 'ol'].includes(element.type) && (
          <>
            <Droppable droppableId={element.id} type="LIST">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps} className="pl-5">
                  {element.content.map((item, idx) => (
                    <ListItem
                      key={item.id}
                      item={item}
                      index={idx}
                      elementId={element.id}
                      modifyListItem={(id, itemId, value) => modifyListItem(id, itemId, value)}
                    />
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
            <button
              onClick={() => modifyListItem(element.id, null, 'add')}
              className="flex items-center p-1 text-green-500 hover:text-green-700 mt-4"
            >
              <PlusIcon className="h-5 w-5 mr-1" /> Add Item
            </button>
          </>
        )}
        {element.type === 'p' && (
          <textarea
            value={element.content}
            onChange={(e) => updateElement(element.id, { content: e.target.value })}
            className="w-full p-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
            placeholder="Paragraph content"
          />
        )}
        {element.type === 'br' && <hr className="my-4 border-t border-gray-300" />}
      </div>
    )}
  </Draggable>
);

const JsonTemplateBuilderRevert = () => {
  const [elements, setElements] = useState([]);
  const [jsonSchema, setJsonSchema] = useState(JSON.stringify({ schema: { properties: { tag: { enum: ['body'] }, children: [] } } }, null, 2));

  useEffect(() => {
    setJsonSchema(JSON.stringify(convertToJsonSchema(), null, 2));
  }, [elements]);

  const addElement = useCallback((type) => {
    setElements((prev) => [
      ...prev,
      {
        id: uuidv4(),
        type,
        content: defaultContent[type] || '',
      }
    ]);
  }, []);

  const removeElement = useCallback((id) => {
    setElements((prev) => prev.filter((el) => el.id !== id));
  }, []);

  const updateElement = useCallback((id, updates) => {
    setElements((prev) =>
      prev.map((el) => (el.id === id ? { ...el, ...updates } : el))
    );
  }, []);

  const modifyListItem = useCallback((elementId, itemId, action) => {
    setElements((prev) =>
      prev.map((el) => {
        if (el.id === elementId) {
          let newContent = [...el.content];
          if (action === 'add') {
            newContent.push({ id: uuidv4(), content: '' });
          } else if (action === null) {
            newContent = newContent.filter((item) => item.id !== itemId);
          } else {
            newContent = newContent.map((item) => (item.id === itemId ? { ...item, content: action } : item));
          }
          return { ...el, content: newContent };
        }
        return el;
      })
    );
  }, []);

  const handleDragEnd = (result) => {
    const { destination, source, type } = result;
    if (!destination) return;

    if (type === 'ELEMENT') {
      const reorderedElements = Array.from(elements);
      const [movedElement] = reorderedElements.splice(source.index, 1);
      reorderedElements.splice(destination.index, 0, movedElement);
      setElements(reorderedElements);
    } else if (type === 'LIST') {
      const elementId = source.droppableId;
      setElements((prevElements) =>
        prevElements.map((element) => {
          if (element.id === elementId) {
            const reorderedItems = Array.from(element.content);
            const [movedItem] = reorderedItems.splice(source.index, 1);
            reorderedItems.splice(destination.index, 0, movedItem);
            return { ...element, content: reorderedItems };
          }
          return element;
        })
      );
    }
  };

  const convertToJsonSchema = () => ({
    schema: {
      properties: {
        tag: { enum: ['body'] },
        children: elements.map((element) => {
          const baseProps = { tag: { enum: [element.type] } };
          if (element.type === 'br') {
            return { properties: baseProps };
          } else if (['ul', 'ol'].includes(element.type)) {
            return {
              properties: {
                ...baseProps,
                children: element.content.map((item) => ({
                  properties: {
                    tag: { enum: ['li'] },
                    content: { enum: [item.content] }
                  }
                }))
              }
            };
          } else {
            return {
              properties: {
                ...baseProps,
                content: { enum: [element.content] }
              }
            };
          }
        })
      }
    }
  });

  const renderPreview = () => (
    <div className="p-5 bg-gray-100 rounded mb-5 text-gray-800">
      {elements.map((element, index) => {
        if (['ul', 'ol'].includes(element.type)) {
          const ListTag = element.type;
          return (
            <div key={index} className="mb-4">
              <ListTag className={`pl-5 ${element.type === 'ul' ? 'list-disc' : 'list-decimal'}`}>
                {element.content.map((item, idx) => (
                  <li key={idx} className="mb-2">{item.content}</li>
                ))}
              </ListTag>
            </div>
          );
        }
        if (element.type === 'br') {
          return <hr key={index} className="my-4 border-t border-gray-300" />;
        }
        return (
          <p key={index} className="mb-4">
            {element.content}
          </p>
        );
      })}
    </div>
  );

  return (
    <div className="font-sans p-8 bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">JSON Template Builder</h1>
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex flex-col md:flex-row gap-8">
            <AddElementSidebar addElement={addElement} />
            <div className="flex-1">
              <div className="bg-white shadow-md rounded-lg p-6 mb-8">
                <h2 className="text-xl font-semibold text-gray-800 border-b-2 border-blue-500 pb-2 mb-4">Template Builder</h2>
                <Droppable droppableId="elements" type="ELEMENT">
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps}>
                      {elements.map((element, index) => (
                        <Element
                          key={element.id}
                          element={element}
                          index={index}
                          updateElement={updateElement}
                          removeElement={removeElement}
                          modifyListItem={modifyListItem}
                        />
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>

              <div className="bg-white shadow-md rounded-lg p-6 mb-8">
                <h2 className="text-xl font-semibold text-gray-800 border-b-2 border-blue-500 pb-2 mb-4">Human-Readable Preview</h2>
                {renderPreview()}
              </div>

              <div className="bg-white shadow-md rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 border-b-2 border-blue-500 pb-2 mb-4">JSON Schema</h2>
                <textarea
                  value={jsonSchema}
                  onChange={(e) => setJsonSchema(e.target.value)}
                  className="w-full h-[300px] p-2 font-mono text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </DragDropContext>
      </div>
    </div>
  );
};

export default JsonTemplateBuilderRevert;
